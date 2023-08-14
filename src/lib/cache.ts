import * as fs from 'fs'

const constructFileName = (identifier: string, fileExtension: string) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-')
  return `${identifier}___${timestamp}.${fileExtension}`
}

const decontructFileName = (fileName: string) => {
  const fileExtension = fileName.split('.').pop()!
  const [identifier, timestamp] = fileName
    .replace(`.${fileExtension}`, '')
    .split('___')
  return { identifier, timestamp, fileExtension }
}

export const saveInCache = ({
  dir,
  identifier,
  content,
  fileExtension,
}: {
  dir: 'documents' | 'searches' | 'errors'
  identifier: string
  content: Buffer
  fileExtension: string
}) => {
  const path = `./cache/${dir}`
  const fileName = constructFileName(identifier, fileExtension)

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }

  fs.writeFileSync(`${path}/${fileName}`, content)
  return fileName
}

export const getFromCache = ({
  dir,
  identifier,
  maxAge,
}: {
  dir: 'documents' | 'searches' | 'errors'
  identifier: string
  maxAge?: number
}) => {
  const path = `./cache/${dir}`
  const files = fs.readdirSync(path)
  const matchingFiles = files.filter((file) => file.startsWith(identifier))

  if (matchingFiles.length) {
    // Sort by date and return the most recent file
    const file = matchingFiles
      .map((fileName) => {
        const { timestamp, fileExtension } = decontructFileName(fileName)
        const date = new Date(timestamp)
        return { fileName, date, fileExtension }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .pop()!
    if (maxAge && file.date.getTime() < Date.now() - maxAge) {
      // File is too old
      console.log('File is too old')
      return null
    }
    return {
      fileName: file.fileName,
      fileExtension: file.fileExtension,
      content: fs.readFileSync(`${path}/${file.fileName}`),
    }
  }
}
