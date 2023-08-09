import * as fs from 'fs'

export const downloadDocument = async (response: Response) => {
  // Download document
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

  return fileName
}
