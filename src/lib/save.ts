import * as fs from 'fs'

export const saveInDocuments = (content: Buffer, fileName: string) => {
  fs.writeFileSync(`./documents/${fileName}`, content)
}
