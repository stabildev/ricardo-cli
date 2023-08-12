import { getFromCache, saveInCache } from './cache'
import { download } from './download'
import { DkDocumentType, RegisterDocumentType, RegisterType } from './types'

export const requestDocument = async ({
  documentType,
  registerType,
  registerNumber,
  cookie,
  viewState,
  documentLink,
  dkDocumentType,
}: {
  documentType: RegisterDocumentType
  registerType: RegisterType
  registerNumber: string
  cookie: string
  viewState: string
  documentLink: string
  dkDocumentType?: DkDocumentType
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
