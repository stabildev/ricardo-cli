import { getFromCache, saveInCache } from './cache'
import { download } from './download'
import { DkDocument, RegisterDocument, RegisterType } from './types'
import * as fs from 'fs'
import * as cheerio from 'cheerio'

// Looks up a document in the cache, if it's not there, it downloads it and saves it in the cache
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
}): Promise<{
  file: {
    content: Buffer
    fileName: string
    fileExtension: string
  } | null
  viewState: string
}> => {
  const cachedDocument = getFromCache({
    documentType: dkDocumentType || documentType,
    registerType,
    registerNumber,
  })
  if (cachedDocument) {
    return {
      file: cachedDocument,
      viewState,
    }
  }
  const result = await download({
    cookie,
    viewState,
    documentLink,
    dkDocumentType,
  })

  if (!result.file) {
    return {
      file: null,
      viewState,
    }
  }

  // Filter out invalid files
  if (!result.file.fileExtension) {
    if (!result.file.content.length) {
      console.error('Downloaded file has no content')
      return {
        file: null,
        viewState,
      }
    }
    if (result.file.content.toString().startsWith('<!DOCTYPE html>')) {
      // Extract error message
      const $ = cheerio.load(result.file.content.toString())
      const error = $('#form p').text().trim()
      if (error) {
        console.error(error)
        return {
          file: null,
          viewState,
        }
      }
      console.error(
        'Downloaded file has html content but no error message. Saving to error folder.'
      )
      const timestamp = new Date().toISOString().replace(/:/g, '-')
      const fileName = `Error_${documentType}_${registerType}_${registerNumber}_${timestamp}.html`
      fs.writeFileSync('./error/' + fileName, result.file.content)
      return {
        file: null,
        viewState,
      }
    }
    console.error(
      'Downloaded file has unknown content. Saving to error folder.'
    )
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `Error_${documentType}_${registerType}_${registerNumber}_${timestamp}.txt`
    fs.writeFileSync('./error/' + fileName, result.file.content)
    return {
      file: null,
      viewState,
    }
  }

  const fileName = saveInCache({
    content: result.file.content,
    documentType: dkDocumentType || documentType,
    registerType: registerType,
    registerNumber: registerNumber,
    fileExtension: result.file.fileExtension,
  })
  console.log('Saved in cache:', fileName)

  return {
    file: {
      ...result.file,
      fileName,
      fileExtension: result.file.fileExtension,
    },
    viewState,
  }
}
