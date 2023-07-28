import jsdom from 'jsdom'
const { JSDOM } = jsdom
import fs from 'fs'

import { postNormaleSuche } from './utils/postNormaleSuche'
import { extractCookie } from './utils/extractCookie'
import { getErgebnisse } from './utils/getErgebnisse'
import { extractViewState } from './utils/extractViewState'
import { parseSearchResults } from './utils/parseSearchResults'
import { postErgebnisse } from './utils/postErgebnisse'
import { getDocumentsDK } from './utils/getDocumentsDK'
import { postDocumentsDK } from './utils/postDocumentsDK'
import { getChargeInfo } from './utils/getChargeInfo'
import { postChargeInfo } from './utils/postChargeInfo'
import { extractUrlPathWithSecIp } from './utils/extractUrlPathWithSecIp'

async function main({
  queryString,
  registerType,
  registerNumber,
  documentType,
  selection = '0_0_0_0',
  asZip = false,
}: {
  queryString?: string
  registerType?: 'HRA' | 'HRB' | 'PR' | 'VR' | 'GnR'
  registerNumber?: string
  documentType?: 'AD' | 'CD' | 'HD' | 'DK' | 'UT' | 'VÖ' | 'SI'
  selection?: string
  asZip?: boolean
}) {
  if (!queryString && (!registerType || !registerNumber)) {
    throw new Error('No query string or register type and number provided!')
  }

  if (
    !!documentType &&
    !['AD', 'CD', 'HD', 'DK', 'UT', 'VÖ', 'SI'].includes(documentType)
  ) {
    throw new Error('Invalid document type!')
  }

  // console.log('Fetching...')

  // Perform search (normale Suche)

  let response = await postNormaleSuche({
    queryString,
    registerType,
    registerNumber,
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // Collect session cookie

  const cookie = extractCookie(response)
  if (!cookie) {
    throw new Error('No cookie found!')
  }

  // Fetch search results

  response = await getErgebnisse({ cookie })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const text = await response.text()
  let dom = new JSDOM(text)
  let document = dom.window.document

  // Collect viewState

  let viewState = extractViewState(document)
  if (!viewState) {
    throw new Error('No viewState found!')
  }

  // Parse search results

  const results = parseSearchResults(document)
  if (!results.length) {
    // console.log('No results found!')
    return
  }

  // console.log('Results:')
  // console.log(JSON.stringify(results, null, 2))

  if (!documentType) {
    // console.log('Done!')
    return
  }

  // First company with document of specified type
  const company = results.find(
    (company) => !!company.documentLinks[documentType]
  )

  if (!company) {
    // console.log(`No document of type ${documentType} found in results!`)
    return
  }

  // console.log(
  //   `Downloading document of type ${documentType} for company ${company.companyName}...`
  // )

  // Document 'link' is actually a form field name
  // It is used to identify the document to download

  const documentLink = company.documentLinks[documentType]
  if (!documentLink) {
    throw new Error('No document link found!')
  }

  // This adds the requester's IP address to the URL

  const urlPathWithSecIp = extractUrlPathWithSecIp(document)

  // Select document to download

  response = await postErgebnisse({
    viewState,
    cookie,
    documentLink,
    urlPathWithSecIp,
  })

  // Should return 302 Found
  if (response.status !== 302) {
    throw new Error(`HTTP error! status: ${response.status}, should be 302`)
  }

  if (documentType === 'DK') {
    // Document selection page
    response = await getDocumentsDK({ cookie })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Collect new viewState
    dom = new JSDOM(await response.text())
    document = dom.window.document
    viewState = extractViewState(document)
    if (!viewState) {
      throw new Error('No viewState found!')
    }

    // Select document to download
    response = await postDocumentsDK({
      viewState,
      cookie,
      selection,
      action: 'select',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    response = await postDocumentsDK({
      viewState,
      cookie,
      action: 'submit',
      selection,
      asZip,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  }

  // Collect new viewState of download page

  response = await getChargeInfo({ cookie })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  dom = new JSDOM(await response.text())
  document = dom.window.document

  viewState = extractViewState(document)
  if (!viewState) {
    throw new Error('No viewState found!')
  }

  // Download document

  response = await postChargeInfo({ viewState, cookie })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  let fileName = 'document'

  const contentDisposition = response.headers.get('Content-Disposition')
  if (contentDisposition) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    const matches = filenameRegex.exec(contentDisposition)
    fileName =
      matches && matches[1] ? matches[1].replace(/['"]/g, '') : 'document'
  }

  // console.log(`Saving file ${fileName} in documents folder!`)
  const buffer = await response.arrayBuffer()
  fs.writeFileSync(`documents/${fileName}`, Buffer.from(buffer))

  // console.log('Done!')
}

const doMain = async () => {
  console.log('Start')
  const startTime = new Date().getTime()
  await main({
    queryString: 'cargokite',
    registerType: 'HRB',
    registerNumber: '273489',
    documentType: 'DK',
    selection: '0_0_0_0', // Gesellschaftsvertrag
    asZip: false,
  })
  await main({
    queryString: 'cargokite',
    registerType: 'HRB',
    registerNumber: '273489',
    documentType: 'DK',
    selection: '0_0_1_0', // Gesellschafterliste
    asZip: false,
  })
  await main({
    queryString: 'cargokite',
    registerType: 'HRB',
    registerNumber: '273489',
    documentType: 'SI',
  })
  await main({
    queryString: 'cargokite',
    registerType: 'HRB',
    registerNumber: '273489',
    documentType: 'AD',
  })
  const endTime = new Date().getTime()
  console.log(`Total time: ${(endTime - startTime) / 1000} s`)
}

doMain()
