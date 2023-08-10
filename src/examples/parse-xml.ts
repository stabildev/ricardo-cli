import * as fs from 'fs'
import * as cheerio from 'cheerio'
import { searchCompany } from '../searchCompany'
import { postChargeInfo, postErgebnisse } from '../utils/requests'

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

function preprocessXML(xml: string): string {
  // Remove namespaces
  xml = xml.replace(/<(\w+:)/g, '<').replace(/<\/(\w+:)/g, '</')
  return xml
}

const parseAddress = async () => {
  if (!fs.existsSync('./documents/SI.xml')) {
    console.info('SI.xml not found. Downloading...')
    await downloadXml('cargokite')
  }
  const xml = fs.readFileSync('./documents/SI.xml', 'utf-8')
  const cleanXml = preprocessXML(xml)
  fs.writeFileSync('./documents/SI_clean.xml', cleanXml)
  const $ = cheerio.load(cleanXml, {
    xmlMode: true,
    lowerCaseTags: true,
    normalizeWhitespace: true,
  })

  const rechtstraegerRolle = $('rolle').filter(function (
    this: cheerio.Element
  ) {
    return $(this).find('rollennummer').text() === '1'
  })
  const beteiligung = rechtstraegerRolle.parent()
  const anschrift = beteiligung.find('anschrift')
  // console.log(anschrift.html())
  const street =
    anschrift.find('strasse').text() + ' ' + anschrift.find('hausnummer').text()
  const zipCode = anschrift.find('postleitzahl').text()
  const city = anschrift.find('ort').text()
  const country = anschrift.find('staat').text()

  console.log({ street, zipCode, city, country })
}
parseAddress()
