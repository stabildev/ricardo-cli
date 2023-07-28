import { JSDOM } from 'jsdom'
import fs from 'fs'
import { extractCookie } from './extractCookie'
import { getErgebnisse } from './getErgebnisse'
import { postNormaleSuche } from './postNormaleSuche'
import { parseSearchResults } from './parseSearchResults'
import { extractViewState } from './extractViewState'
import { extractUrlPathWithSecIp } from './extractUrlPathWithSecIp'
import { postErgebnisse } from './postErgebnisse'
import { getDocumentsDK } from './getDocumentsDK'
import { postDocumentsDK } from './postDocumentsDK'
import { postChargeInfo } from './postChargeInfo'
import { getChargeInfo } from './getChargeInfo'

export const getMultipleDocsForCompany = async ({
  queryString,
  registerType,
  registerNumber,
  documentTypes,
  selections = ['0_0_0_0'],
  asZip = false,
}: {
  queryString?: string
  registerType?: 'HRA' | 'HRB' | 'PR' | 'VR' | 'GnR'
  registerNumber?: string
  documentTypes: ('AD' | 'CD' | 'HD' | 'DK' | 'UT' | 'VÖ' | 'SI')[]
  selections?: string[]
  asZip?: boolean
}) => {
  if (!queryString && (!registerType || !registerNumber)) {
    throw new Error('No query string or register type and number provided!')
  }

  if (documentTypes.length === 0) {
    throw new Error('No document types provided!')
  }

  let counter = 0

  let response = await postNormaleSuche({
    queryString,
    registerType,
    registerNumber,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const cookie = extractCookie(response)
  if (!cookie) {
    throw new Error('No cookie found!')
  }

  response = await getErgebnisse({ cookie })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const text = await response.text()
  let dom = new JSDOM(text)
  let document = dom.window.document

  const urlPathWithSecIp = extractUrlPathWithSecIp(document)
  if (!urlPathWithSecIp) {
    throw new Error('No urlPathWithSecIp found!')
  }

  const results = parseSearchResults(document)
  if (!results.length) {
    throw new Error('No results found!')
  }

  let company = results[0]

  for (const documentType of documentTypes) {
    for (const selection of documentType === 'DK' ? selections : '1') {
      const documentLink = company.documentLinks[documentType]

      // todo: switch to while or do-while loop
      if (!documentLink) continue

      let viewState = extractViewState(document)
      if (!viewState) {
        throw new Error('No viewState found!')
      }

      response = await postErgebnisse({
        cookie,
        viewState,
        urlPathWithSecIp,
        documentLink,
      })

      // Should return 302 Found
      if (response.status !== 302) {
        throw new Error(`HTTP error! status: ${response.status}`)
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

      let fileName = `document-${Date.now()}`

      const contentDisposition = response.headers.get('Content-Disposition')
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(contentDisposition)
        fileName =
          matches && matches[1]
            ? matches[1].replace(/['"]/g, '')
            : `document-${Date.now()}}`
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(`documents/${fileName}`, Buffer.from(buffer))
      counter++
    }
  }
  return [counter, company]
}
