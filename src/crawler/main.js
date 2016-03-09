import fs from 'fs'
import _ from 'lodash'
import slug from 'slug'
import domutils from 'domutils'
import { select } from 'soupselect'
import htmlparser from 'htmlparser2'
import algoliasearch from 'algoliasearch'
import requestPromise from 'request-promise'
import { AllHtmlEntities } from 'html-entities'

var entities = new AllHtmlEntities()
var algolia = algoliasearch(process.env.ALGOLIA_APP, process.env.ALGOLIA_KEY)
var paragraphsIndex = algolia.initIndex('paragraphs')

async function crawl() {

  try {
    var presidentCounter = 0
    var speechCounter = 0
    var paragraphCounter = 0

    var currentSpeaker
    var currentRecord

    var indexPageHtml = await getHtml('index', 'http://millercenter.org/president/speeches')
    var indexDom = getDom(indexPageHtml)
    var listing = select(indexDom, "#listing")[0]

    for (var index in listing.children) {

      var element = listing.children[index]
      var _class = element.attribs ? element.attribs.class : ''
      if (_class === "president") {
        var presidentName = element.children[0].data.trim()
        currentSpeaker = presidentName
        presidentCounter++
      }

      if (_class === "entry") {

        var link = select(element, 'a')[0]
        var href = link.attribs.href
        var text = domutils.getText(link)
        var matches = text.match(/\([^)]+\)/g)
        var dateMatch = matches[matches.length - 1]
        var dateString = dateMatch.replace(/[\(\)]/g, '')
        var date = new Date(Date.parse(dateString))
        var title = text.replace(dateMatch, '').trim()
        var speechSlug = slug(text)

        if (href === '/president/hoover/speeches/campaign-speech-in-indianapolis-indiana')
          continue

        var speechUrl = `http://millercenter.org${href}`

        var baseRecord = currentRecord = {
          speechSlug,
          url: speechUrl,
          speaker: currentSpeaker,
          title,
          isoDate: date.toISOString(),
          unixDate: date.getTime() / 1000
        }

        var speechHtml = await getHtml(text.replace(/\//, '-'), speechUrl)
        var speechDom = getDom(speechHtml)

        let recordParagraphs = []
        var wordsInSpeechCount = 0
        var paragraphsInSpeechCount = 0

        var mainElement = select(speechDom, "#transcript")[0]
        var transcriptHtml = domutils.getInnerHTML(mainElement)
        transcriptHtml = transcriptHtml.replace(/<br\/?>/gi, '\n')
        transcriptHtml = transcriptHtml.replace(/<p>/gi, '')
        transcriptHtml = transcriptHtml.replace(/<\/p>/gi, '\n')
        transcriptHtml = transcriptHtml.replace(/(<([^>]+)>)/gi, '')
        transcriptHtml = entities.decode(transcriptHtml)

        let paras = transcriptHtml.split(/\n/)
        for (var pIndex in paras) {
          var para = paras[pIndex].trim()
          if (para.length === 0)
            continue
          if (para === 'Transcript')
            continue

          paragraphCounter++
          paragraphsInSpeechCount++
          wordsInSpeechCount += para.split(/\s+/).length

          recordParagraphs.push(para)
        }

        var indexRecords = []
        for (var rIndex in recordParagraphs) {
          var rPara = recordParagraphs[rIndex]
          var paragraphSlug = `${speechSlug}-${rIndex}`
          var indexRecord = Object.assign({
            objectID: paragraphSlug,
            paragraphSlug: paragraphSlug,
            paragraphSequence: rIndex,
            text: rPara,
            wordsInSpeechCount: wordsInSpeechCount,
            wordsInParagraphCount: rPara.split(/\s+/).length,
            paragraphsInSpeechCount: paragraphsInSpeechCount
          }, baseRecord)
          indexRecords.push(indexRecord)
        }

        await paragraphsIndex.saveObjects(indexRecords)
        console.log("Indexed Speech: %s, Paragraphs: %s", speechSlug, indexRecords.length)

        speechCounter++
      }
    }

    console.log("Finished! Presidents=%s, speeches=%s, paragraphs=%s",
      presidentCounter, speechCounter, paragraphCounter);
    process.exit(0)

  } catch (error) {
    console.log(JSON.stringify(currentRecord, undefined, ' '))
    console.error("ERROR", error);
    process.exit(-1)
  }

}

function getDom(html) {
  var handler = new htmlparser.DefaultHandler(function(error, dom) {})
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
  return handler.dom
}

async function getHtml(key, url) {
  var filename = `./cache/${key}.html`
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename, 'utf8')
  } else {
    var html = await requestPromise(url)
    fs.writeFileSync(filename, html, 'utf8')
    return html
  }
}

crawl()
