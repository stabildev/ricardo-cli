// Extract available dk types for a sizable sample of results

import { getDocumentsDK, postDocumentsDK } from './utils/requests'
import * as cheerio from 'cheerio'
import { extractViewState } from './utils/parse-utils'

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

export const getSelectionCodes = async ({
  cookie,
  viewState,
}: {
  cookie: string
  viewState: string
}) => {
  const response = await getDocumentsDK({ cookie })
  let html = await response.text()
  let $ = cheerio.load(html)
  viewState = extractViewState($) // update viewState

  const clickedNodes: string[] = [] // keep track of already clicked tree nodes
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
      const response = await postDocumentsDK({
        cookie,
        viewState,
        selection: rowkey,
        action: 'select',
      })

      // Add rowKey to list of clicked tree nodes
      clickedNodes.push(rowkey)

      // the response is a partial ajax response that contains the complete tree
      // we need to extract the html from it (after complete for loop)
      html = await response.text()
    }

    // check if there are more tree nodes to expand on the next level
    $ = cheerio.load(html)
  } while (newParentNodes.length > 0)

  // Once all tree nodes are expanded, we can extract the available documents

  let result: Map<string, [string, string][]> = new Map()

  // get all top level nodes to group by top level
  const topLevelNodes = $('#dk_form\\:dktree\\:0_0 > ul > li')

  for (const node of topLevelNodes) {
    const groupName = $(node).children(':first-child').text()

    const docs: [string, string][] = $(node)
      .find('li.ui-treenode-leaf')
      .toArray()
      .map((el) => {
        const name = $(el).text()
        const selectionCode = $(el).attr('data-rowkey')!
        return [name, selectionCode]
      })
    result.set(groupName, docs)
  }
  return { selectionCodes: result, cookie, viewState }
}
