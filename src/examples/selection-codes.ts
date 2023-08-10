// Extract available dk types for a sizable sample of results

import { searchCompany } from '../searchCompany'
import {
  postErgebnisse,
  getDocumentsDK,
  postDocumentsDK,
} from '../utils/requests'
import * as cheerio from 'cheerio'
import { extractViewState } from '../utils/parse-utils'
import { DocumentNode } from '../types'

searchCompany({
  queryString: 'cargokite',
}).then(async ({ results, cookie, viewState }) => {
  console.log('viewState', viewState)
  for (const result of results.slice(0, 1)) {
    let documentCodes: [string, string][] = []

    await postErgebnisse({
      cookie,
      viewState,
      documentLink: result.documentLinks.DK!,
    })

    const response = await getDocumentsDK({ cookie })
    let html = await response.text()
    let $ = cheerio.load(html)
    viewState = extractViewState($) // update viewState
    console.log('viewState', viewState)

    // Iteratively expand all tree nodes to get a list of all available documents
    // li.ui-treenode-parent s müssen expandiert werden
    // li.ui-treenode-parent s enthalten [data-rowkey] attribute with selection code

    // li.ui-treenode-parent > li.ui-treenode-parent > ... > li.ui-treenode-leaf
    // We are looking for the leaves
    // We must keep track of already opened parents to not click and close them
    // There is a [data-nodetype="doc"] for the document leaves
    // and a [data-nodetype="list"] for the parents

    // So we can theoretically
    // 1) extract all available parent nodes
    // 2) click on each parent and put the parent's rowkey in an array
    // 3) check again for NEW parents with NEW rowkeys
    // 4) Repeat until there are no NEW parents
    // 5) Extract info from all child nodes
    // Let's go!

    const clickedNodes: string[] = []
    let newParentNodes: string[] = []

    do {
      // this selector skips the outer layer
      let parentNodes = $('ul.ui-treenode-children li.ui-treenode-parent')

      newParentNodes = parentNodes
        .toArray()
        .map((node) => $(node).attr('data-rowkey')!)
        .filter((key) => !clickedNodes.includes(key))

      for (const rowkey of newParentNodes) {
        // click on tree node
        console.log('Clicking on tree node with rowkey ' + rowkey)
        const response = await postDocumentsDK({
          cookie,
          viewState,
          selection: rowkey,
          action: 'select',
        })
        console.log(response.status)

        // Add rowKey to list of already clicked tree nodes
        clickedNodes.push(rowkey)

        // the response is a partial ajax response that contains the complete tree
        // we need to extract the html from it (after complete for loop)
        html = await response.text()
      }

      // check if there are more tree nodes to expand on the next level
      $ = cheerio.load(html)
    } while (newParentNodes.length > 0)

    // Once all tree nodes are expanded, we can extract the available documents

    // get all document nodes
    const docNodes = $('ul.ui-treenode-children li.ui-treenode-leaf')

    for (const docNode of docNodes.toArray()) {
      const rowKey = $(docNode).attr('data-rowkey')
      if (!rowKey) {
        console.log('rowKey not found!')
        continue
      }
      const documentDescription = $(docNode).text()
      // get inner text
      documentCodes.push([rowKey, documentDescription])
    }
    console.log(documentCodes)
  }
})
