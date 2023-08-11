// Extract available dk types for a sizable sample of results

import { getDocumentsDK, postDocumentsDK } from './utils/requests'
import * as cheerio from 'cheerio'
import { extractViewState } from './utils/parse-utils'

// This function looks only in the top level for a document with the specified name
// and returns the first document node under it. Otherwise returns null

export const getSelectionCodes = async (
  documentNames: string[],
  {
    cookie,
    viewState,
  }: {
    cookie: string
    viewState: string
  }
) => {
  const result = new Map<string, string>() // e.g. 'Liste der Gesellschafter' => '0_0_1_0'

  // 1) Go to DK document selectino page
  let response = await getDocumentsDK({ cookie })
  let $ = cheerio.load(await response.text())

  // 2) Update view state and extract button ID
  viewState = $('input[name="javax.faces.ViewState"]').val()
  const buttonId = $('button').attr('id')!

  // 3) Expand the top level...
  response = await postDocumentsDK({
    cookie,
    viewState,
    selectionCode: '0_0',
    action: 'select',
  })
  // 4) Retrieve partial ajax response
  $ = cheerio.load(await response.text())

  // 5) Extract tree nodes of top level document names, e. g. 'Liste der Gesellschafter'
  const topLevelCodes = $('#dk_form\\:dktree\\:0_0 > ul > li')
    // 6) Filter by those requested
    .filter((_, node) => documentNames.includes($(node).text()))
    .toArray()

    // 7) Map document name to 3-digit top level selection code, e. g. ['Liste der Gesellschafter', '0_0_1']
    .map((el) => [$(el).text(), $(el).attr('data-rowkey')])

  // 8) Repeat this for all found top-level document codes
  for (const [documentName, rowkey] of topLevelCodes) {
    if (!rowkey || !documentName) {
      console.error('rowkey or documentName not found!')
      continue
    }

    // We will keep a reference to the current node key for navigation
    let currentNodeKey = rowkey

    do {
      // 9) Click on the current node
      response = await postDocumentsDK({
        cookie,
        viewState,
        selectionCode: currentNodeKey,
        action: 'select',
      })
      // 10) Retrieve partial ajax response
      $ = cheerio.load(await response.text())

      // 11) Find first child node of the current node
      const childNode = $(
        `#dk_form\\:dktree\\:${currentNodeKey} li.ui-treenode`
      ).first()

      // 12) There should always be a child node after expansion
      // So this should never be executed
      if (!childNode.length) {
        console.error('No document node found for ' + documentName)
        break
      }

      // 13) We're going one level deeper. Set child node to be new current node
      currentNodeKey = $(childNode).attr('data-rowkey')!

      // 14) If node is a leaf it contains our selection code
      // Extract rowkey / node key / selection code and add to map
      // Break out of the do...while loop and continue with for loop
      if ($(childNode).hasClass('ui-treenode-leaf')) {
        const selectionCode = currentNodeKey
        result.set(documentName, selectionCode)
        console.log(
          `Found selection code for "${documentName}": ${selectionCode}`
        )
        break // break out of the loop
      }

      // 15) Otherwise the node is a parent and we will click on it in the next iteration
    } while (true) // The do...while loop will be repeated until manually broken out of
  }
  return { result, cookie, viewState, buttonId }
}

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

export const getAllSelectionCodes = async ({
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
  const buttonId = $('button').attr('id')!

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
        selectionCode: rowkey,
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
  return { selectionCodes: result, cookie, viewState, buttonId }
}
