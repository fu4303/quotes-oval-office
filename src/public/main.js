import moment from 'moment'
import instantsearch from 'instantsearch.js'

require('./favicon.ico')
require('./apple-touch-icon.png')
require('./images/logo.png')
require('./images/government.png')
require('./images/washington-dc.png')
require('./images/america-background.jpg')
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

var refinementItemTemplate = `
  <input type="checkbox" class="{{cssClasses.checkbox}} refined-{{isRefined}}" value="{{name}}" {{#isRefined}}checked{{/isRefined}} />
  <label class="refined-{{isRefined}}">&rsaquo; {{name}}</label>`

var search = instantsearch({
  appId: '8H5CQDOJ8H',
  apiKey: 'edfcf1f288a73d9e6778b4d244420085',
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
  instantsearch.widgets.refinementList({
    container: '#facets-container',
    attributeName: 'speaker',
    operator: 'or',
    limit: 50,
    sortBy: ['name:asc'],
    templates: {
      item: refinementItemTemplate
    }
  })
);

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits-container',
    templates: {
      empty: '',
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
