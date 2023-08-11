import * as cheerio from 'cheerio'
import * as fs from 'fs'

export const preprocessXML = (xml: string) => {
  // Remove namespaces
  xml = xml.replace(/<(\w+:)/g, '<').replace(/<\/(\w+:)/g, '</')

  // Remove underscores and dots within tags
  xml = xml.replace(/<(\/?[^>]*?)[_.]/g, '<$1')
  return xml
}

export const parseSI = (xml: string) => {
  const cleanXml = preprocessXML(xml)
  const $ = cheerio.load(cleanXml, {
    xmlMode: true,
    lowerCaseTags: true,
    normalizeWhitespace: true,
  })

  const rechtstraeger = $(
    'fachdatenregister > basisdatenregister > rechtstraeger'
  )
  const beteiligter = $(
    'grunddaten > verfahrensdaten > beteiligung:first'
  ).find('auswahlbeteiligter, beteiligter')
  const company = beteiligter.length ? beteiligter : rechtstraeger

  const name = company.find('bezeichnungaktuell').text()
  fs.writeFileSync(`./documents/SI_${name}_clean.xml`, cleanXml)
  const hq = company.find('sitz > ort').text()
  const anschrift = company.find('anschrift')
  const street = anschrift.find('strasse').text()
  const number = anschrift.find('hausnummer').text()
  const zip = anschrift.find('postleitzahl').text()
  const city = anschrift.find('ort').text()
  const countryCode =
    anschrift.find('staat code').text() ||
    anschrift.find('staat content').text() ||
    anschrift.find('staat').text() ||
    company.find('sitz > staat code').text() ||
    company.find('sitz > staat content').text() ||
    company.find('sitz > staat').text()

  return {
    name,
    hq,
    address: {
      street,
      number,
      zip,
      city,
      countryCode,
    },
  }
}
