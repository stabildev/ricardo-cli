import * as fs from 'fs'
import {
  containsXML,
  extractCookie,
  parseResults,
  parseSI,
} from '../lib/parse-utils'
import {
  getErgebnisse,
  postChargeInfo,
  postErgebnisse,
  postNormaleSuche,
} from '../lib/requests'
import { RegisterDocumentType } from '../lib/types'

const queryString = 'google'
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
  console.log('viewState', viewState)

  const documentLink = results?.[0].documentLinks.get(RegisterDocumentType.SI)

  if (!documentLink) {
    console.error('No SI document link found.')
    return
  }

  console.time('download')
  await postErgebnisse({
    viewState,
    cookie,
    documentLink,
  })
  response = await postChargeInfo({
    viewState,
    cookie,
  })
  console.timeEnd('download')
  const text = await response.text()
  if (!containsXML(text)) {
    console.error('Response does not contain XML')
    console.log(text)
  }

  fs.writeFileSync(`./documents/SI_${results[0].name}.xml`, text)

  const { name, hq, address } = parseSI(text)

  console.log('SI parsing results:')
  console.log('Name: ' + name)
  console.log('HQ: ' + hq)
  console.log(address)
})
