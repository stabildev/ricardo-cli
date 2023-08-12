import * as fs from 'fs'
import * as cheerio from 'cheerio'
import {
  extractAvailableDkDocuments,
  extractButtonId,
  extractCookie,
  extractFileName,
  extractViewState,
  parseResults,
} from '../lib/parse-utils'
import {
  getChargeInfo,
  getDocumentsDK,
  getErgebnisse,
  postChargeInfo,
  postDocumentsDK,
  postErgebnisse,
  postNormaleSuche,
} from '../lib/requests'
import { RegisterDocumentType } from '../lib/types'

const queryString = 'lidl'
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
  console.log('cookie', cookie)
  let { results, viewState } = parseResults({
    html: await response.text(),
    includeHistory: true,
  })
  console.log(`Found ${results.length} results`)
  console.log('viewState', viewState)

  const documentLink = results?.[0].documentLinks.get(RegisterDocumentType.DK)

  if (!documentLink) {
    console.error('No DK document link found.')
    return
  }

  console.time('download')
  // Select DK document link
  await postErgebnisse({
    viewState,
    cookie,
    documentLink,
  })
  response = await getDocumentsDK({
    cookie,
  })
  let $ = cheerio.load(await response.text())
  viewState = extractViewState($)
  console.log('viewState', viewState)

  // We need this button id later to submit the form
  const buttonId = extractButtonId($)
  console.log('buttonId', buttonId)

  // Expand top level node to see available documents and selection codes
  response = await postDocumentsDK({
    viewState,
    cookie,
    action: 'select',
    selectionCode: '0_0',
  })
  $ = cheerio.load(await response.text())
  const availableDocs = extractAvailableDkDocuments($)
  const topLevelCode = availableDocs.get('Liste der Gesellschafter') // e.g. 0_0_1

  if (!topLevelCode) {
    console.error('No LdG document selection code found!')
    return
  }

  // Iteratively expand treenodes until we encounter a leaf
  // Starting with the top level node that contains our document
  let currentRowKey = topLevelCode
  let selectionCode: string | null = null

  // The do loop will be executed at least once and as long as
  // the while condition is true
  do {
    const currentNode = $(`li#dk_form\\:dktree\\:${currentRowKey}`)

    // If the current node is a leaf, its rowkey is our selection code
    if (currentNode.hasClass('ui-treenode-leaf')) {
      selectionCode = currentRowKey
      break
    } else {
      // Otherwise we will expand the current node by clicking on it
      response = await postDocumentsDK({
        cookie,
        viewState,
        action: 'select',
        selectionCode: currentRowKey,
      })
      // Retrieve partial ajax response with expanded tree html
      $ = cheerio.load(await response.text())
      // Find first child node of current node and move to it
      const nextNode = $(
        `li#dk_form\\:dktree\\:${currentRowKey} li.ui-treenode`
      ).first()
      const nextRowKey = nextNode.attr('data-rowkey')
      if (!nextRowKey) {
        console.error('Row key not found!')
        return
      }
      currentRowKey = nextRowKey
    }
  } while (!selectionCode)

  // If we arrive here, we have found our selection code
  console.log('selectionCode', selectionCode)

  // Select document using selection code
  await postDocumentsDK({
    viewState,
    cookie,
    action: 'select',
    selectionCode,
  })

  // Submit form using button id
  await postDocumentsDK({
    viewState,
    cookie,
    action: 'submit',
    selectionCode,
    buttonId,
  })

  // Apparently this is necessary
  response = await getChargeInfo({
    cookie,
  })
  viewState = extractViewState(await response.text())
  console.log('viewState', viewState)

  // Finally
  response = await postChargeInfo({
    viewState,
    cookie,
  })

  // Save file
  const fileExtension =
    extractFileName(response.headers.get('content-disposition'))[1] || 'unknown'
  fs.writeFileSync(
    `./documents/LdG_${results[0].name}.${fileExtension}`,
    Buffer.from(await response.arrayBuffer())
  )
  console.timeEnd('download')
})
