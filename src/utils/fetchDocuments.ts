import fs from 'fs'

import { CompanySearchResult, RegistryDocument, RegistryType } from '../types'
import { postChargeInfo, postDocumentsDK, postErgebnisse } from './requests'
import { searchCompany } from './searchCompany'

export const fetchDocumentsWithViewState = async ({
  documents,
  dkDocumentSelections,
  company,
  viewState,
  cookie,
  asZip = false,
}: {
  documents: RegistryDocument[]
  dkDocumentSelections?: string[]
  company: CompanySearchResult
  viewState: string
  cookie: string
  asZip?: boolean
}): Promise<string[]> => {
  let fileNames: string[] = []

  for (const documentType of documents ?? []) {
    for (const selection of documentType === 'DK' &&
    !!dkDocumentSelections?.length
      ? dkDocumentSelections
      : '1') {
      const documentLink = company.documentLinks[documentType]
      if (!documentLink) continue

      let response = await postErgebnisse({
        cookie,
        viewState,
        documentLink,
      })

      // Should return 302 Found
      if (response.status !== 302) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (documentType === 'DK') {
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
      fileNames.push(fileName)
    }
  }

  return fileNames
}

export const fetchDocuments = async ({
  documents,
  dkDocumentSelections,
  cookie: originalCookie,
  companyName,
  registryNumber,
  registryType,
  asZip = false,
}: {
  documents: RegistryDocument[]
  dkDocumentSelections?: string[]
  cookie?: string
  companyName: string
  registryNumber: string
  registryType: RegistryType
  asZip?: boolean
}): Promise<string[]> => {
  const { results, cookie, viewState } = await searchCompany({
    queryString: companyName,
    registryNumber,
    registryType,
    cookie: originalCookie,
  })
  let company = results[0]
  if (!company) {
    throw new Error('No company found!')
  }

  return await fetchDocumentsWithViewState({
    documents,
    dkDocumentSelections,
    company,
    viewState,
    cookie,
    asZip,
  })
}
