import * as fs from 'fs'
import { parseSI } from '../utils/parseSI'

// Load all xml files
const folderPath = './documents'
const files = fs
  .readdirSync(folderPath)
  .filter((file) => file.endsWith('.xml'))
  .filter((file) => !file.endsWith('_clean.xml'))

// Parse xml files
for (const file of files) {
  console.log(file)
  const { name, hq, address } = parseSI(
    fs.readFileSync(`${folderPath}/${file}`, 'utf8')
  )
  console.log('Name: ' + name)
  console.log('HQ: ' + hq)
  console.log(address)
}
