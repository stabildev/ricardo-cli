import * as fs from 'fs'
import { searchCompany } from '../searchCompany'
import { postChargeInfo, postErgebnisse } from '../utils/requests'
import { parseSI } from '../utils/parseSI'

const downloadXml = async (queryString: string) => {
  // Search for company
  const { results, cookie, viewState } = await searchCompany({
    queryString,
  })

  // Select first result's SI document
  await postErgebnisse({
    cookie,
    viewState,
    documentLink: results[0].documentLinks.SI!,
  })

  // Download SI xml
  const xml = await postChargeInfo({ cookie, viewState })
    .then((res) => res.arrayBuffer())
    .then((buffer) => Buffer.from(buffer).toString())

  fs.writeFileSync(`documents/SI.xml`, xml)
}

const parseAddress = async () => {
  if (!fs.existsSync('./documents/SI.xml')) {
    console.info('SI.xml not found. Downloading...')
    await downloadXml('cargokite')
  }
  const xml = fs.readFileSync('./documents/SI.xml', 'utf-8')
  const { address } = parseSI(xml)

  console.log(address)
}
parseAddress()
