import {
  extractAvailableDkDocuments,
  extractButtonId,
  extractFileName,
  extractViewState,
} from './parse-utils'
import {
  getChargeInfo,
  getDocumentsDK,
  postChargeInfo,
  postDocumentsDK,
  postErgebnisse,
} from './requests'
import { DkDocument } from './types'
import * as cheerio from 'cheerio'

export const download = async ({
  cookie,
  viewState,
  documentLink,
  dkDocumentType,
}: {
  cookie: string
  viewState: string
  documentLink: string
  dkDocumentType?: DkDocument
}): Promise<{
  file: {
    content: Buffer
    fileName: string | null
    fileExtension: string | null
  } | null
  viewState: string
}> => {
  // Select document link
  await postErgebnisse({
    viewState,
    cookie,
    documentLink,
  })

  if (dkDocumentType) {
    let response = await getDocumentsDK({
      cookie,
    })

    let $ = cheerio.load(await response.text())
    viewState = extractViewState($)

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
    const topLevelCode = availableDocs.get(dkDocumentType) // e.g. 0_0_1

    if (!topLevelCode) {
      console.error(`No ${dkDocumentType} document selection code found!`)
      return {
        file: null,
        viewState,
      }
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
          return {
            file: null,
            viewState,
          }
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
  }

  // Apparently this is necessary
  let response = await getChargeInfo({
    cookie,
  })
  viewState = extractViewState(await response.text())

  // Finally
  response = await postChargeInfo({
    viewState,
    cookie,
  })

  // Save file
  const fileNameAndExtension = extractFileName(
    response.headers.get('content-disposition')
  )
  if (!fileNameAndExtension[0]) {
    console.error('File name not found!')
  }
  if (!fileNameAndExtension[1]) {
    console.error('File extension not found!')
  }
  return {
    file: {
      fileName: fileNameAndExtension[0],
      fileExtension: fileNameAndExtension[1],
      content: Buffer.from(await response.arrayBuffer()),
    },
    viewState,
  }
}
