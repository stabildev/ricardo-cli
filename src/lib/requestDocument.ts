import { getFromCache, saveInCache } from './cache'
import { download } from './download'
import { DkDocument, RegisterDocument, RegisterType } from './types'

export const requestDocument = async ({
  documentType,
  registerType,
  registerNumber,
  cookie,
  viewState,
  documentLink,
  dkDocumentType,
}: {
  documentType: RegisterDocument
  registerType: RegisterType
  registerNumber: string
  cookie: string
  viewState: string
  documentLink: string
  dkDocumentType?: DkDocument
}) => {
  const cachedDocument = getFromCache({
    documentType: dkDocumentType || documentType,
    registerType,
    registerNumber,
  })
  if (cachedDocument) {
    return {
      ...cachedDocument,
      viewState,
    }
  }
  const result = await download({
    cookie,
    viewState,
    documentLink,
    dkDocumentType,
  })

  if (!result) {
    return null
  }

  const fileName = saveInCache({
    content: result.content,
    documentType: dkDocumentType || documentType,
    registerType: registerType,
    registerNumber: registerNumber,
    fileExtension: result.fileExtension!,
  })
  console.log('Saved in cache:', fileName)

  return result
}
