import moment from 'moment'
import instantsearch from 'instantsearch.js'

require('./favicon.ico')
require('./apple-touch-icon.png')
require('./images/logo.png')
require('./images/government.png')
require('./images/washington-dc.png')
require('./images/america-background.png')
require('./css/bootstrap.css')
require('./css/instantsearch.css')
require('./css/main.css')
require('file?name=[name].[ext]!./index.html')

var itemTemplate = (data) => {
  if (data.text.length < 200)
    return ""
  var quoteValue = data._highlightResult.text.value
  var shortQuoteValue = data._highlightResult.text.value
  var friendlyDate = moment(data.unixDate * 1000).format('MMM Do, YYYY')
  var friendlyAgo = moment(data.unixDate * 1000).fromNow()
  return `
    <div class="panel panel-default">
      <div class="panel-body">
        <div class="col-md-12">
          <p class="quote-text">${quoteValue}</p>
        </div>
      </div>
      <div class="panel-footer">
        <a target="_blank" href="${data.url}">${data._highlightResult.title.value}</a>
        <br/>
        <span class="text-muted"><strong>${data._highlightResult.speaker.value}</strong> &middot; ${friendlyDate} &middot; ${friendlyAgo}</span>
      </div>
    </div>
  `
}

var search = instantsearch({
  appId: 'LJWA1ETX6Y',
  apiKey: 'b17e3b630561cf3717d70a1ffa4c5450',
  indexName: 'paragraphs',
  urlSync: true
})

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-box',
    placeholder: 'Search 500+ speeches by 43 US presidents...',
    poweredBy: true
  })
)

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits-container',
    templates: {
      empty: '<p class="nothing-found text-danger">No quotes found.</p>',
      item: itemTemplate
    },
    hitsPerPage: 25
  })
)

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats-container'
  })
)

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination-container',
    maxPages: 20,
    scrollTo: "#hits-container"
  })
)

search.start()
