import * as fs from 'fs'
import { CacheDocument, RegisterType } from './types'

export const saveInCache = ({
  content,
  documentType,
  registerType,
  registerNumber,
  fileExtension,
}: {
  content: Buffer
  documentType: CacheDocument
  registerType: RegisterType
  registerNumber: string
  fileExtension: string
}) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-')
  const fileName = `${documentType}_${registerType}_${registerNumber}_${timestamp}.${fileExtension}`
  fs.writeFileSync(`./cache/${fileName}`, content)
  return fileName
}

export const getFromCache = ({
  documentType,
  registerType,
  registerNumber,
}: {
  documentType: CacheDocument
  registerType: RegisterType
  registerNumber: string
}) => {
  const files = fs.readdirSync('./cache')
  const query = `${documentType}_${registerType}_${registerNumber}`
  console.log('query', query)
  const matchingFile = files.find((file) => file.startsWith(query))
  if (matchingFile) {
    console.log('Found in cache: ', matchingFile)
    return {
      fileName: matchingFile,
      fileExtension: matchingFile.split('.').pop(),
      content: fs.readFileSync(`./cache/${matchingFile}`),
    }
  }
  console.log('File not found in cache')
  return null
}
