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

  return xml
}

function preprocessXML(xml: string): string {
  // 1. Remove namespaces
  xml = xml.replace(/<(\w+:)/g, '<').replace(/<\/(\w+:)/g, '</')

  // 2. Convert all tags to lowercase
  xml = xml.replace(/<\/?(\w+)/g, (tag) => tag.toLowerCase())

  return xml
}

const parseXml = (xml: string) => {
  const cleanXml = preprocessXML(xml)
  fs.writeFileSync('documents/clean.xml', cleanXml)
  const $ = cheerio.load(cleanXml, { xmlMode: true, lowerCaseTags: true })

  // Extract <Rolle> with Rollennummer 3

  const rechtstraegerRolle = $('rolle').filter(function (
    this: cheerio.Element
  ) {
    return $(this).find('rollennummer').text() === '1'
  })

  const beteiligung = rechtstraegerRolle.parent()
  const anschrift = beteiligung.find('Anschrift')
  // console.log(anschrift.html())
  const street =
    anschrift.find('strasse').text() + ' ' + anschrift.find('hausnummer').text()
  const zipCode = anschrift.find('postleitzahl').text()
  const city = anschrift.find('ort').text()
  const country = anschrift.find('staat').text()

  console.log({ street, zipCode, city, country })
}

// Download XML from search results
downloadXml('cargokite').then((xml) => {
  parseXml(xml)
})

// Alternatively, you can use the XML file from the documents folder
fs.readFile('documents/SI.xml', 'utf8', (err, xml) => {
  parseXml(xml)
})
