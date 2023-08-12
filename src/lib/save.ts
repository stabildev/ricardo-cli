import * as fs from 'fs'

export const saveInDocuments = (content: string, fileName: string) => {
  fs.writeFileSync(`./documents/${fileName}`, content)
}
