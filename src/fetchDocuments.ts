import { CompanySearchResult, RegistryDocument, RegistryType } from './types'
import {
  postChargeInfo,
  postDocumentsDK,
  postErgebnisse,
} from './utils/requests'
import { searchCompany } from './searchCompany'
import { downloadDocument } from './utils/downloadDocument'

// Uses viewState, cookie and documentLink to download documents
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

      await postErgebnisse({
        cookie,
        viewState,
        documentLink,
      })

      if (documentType === 'DK') {
        // Select document to download
        await postDocumentsDK({
          viewState,
          cookie,
          selection,
          action: 'select',
        })

        await postDocumentsDK({
          viewState,
          cookie,
          action: 'submit',
          selection,
          asZip,
        })
      }

      // Download document
      const response = await postChargeInfo({ viewState, cookie })
      fileNames.push(await downloadDocument(response))
    }
  }

  return fileNames
}

// Performs a new search and calls fetchDocumentsWithViewState internally
// Useful if you want to delegate a request to a proxy
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
