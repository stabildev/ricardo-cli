import { extractCookie, parseResults } from '../lib/parse-utils'
import { getErgebnisse, postNormaleSuche } from '../lib/requests'

const queryString = 'amazon'
console.log(`Searching for "${queryString}"...`)

console.time('search')
postNormaleSuche({
  queryString,
}).then(async (response) => {
  const cookie = extractCookie(response)
  response = await getErgebnisse({
    cookie,
  })
  console.timeEnd('search')
  console.log(cookie)
  const { results, viewState } = parseResults({
    html: await response.text(),
    includeHistory: true,
  })
  console.log(`Found ${results.length} results`)
  console.dir(results, { depth: null })
  console.log('viewState', viewState)
})
