import * as fs from 'fs'
import * as cheerio from 'cheerio'

const parseAddress = () => {
  const xml = fs.readFileSync('./documents/SI.xml')
  const $ = cheerio.load(xml, {
    xmlMode: true,
    lowerCaseTags: true,
    normalizeWhitespace: true,
  })

  const rechtstraegerRolle = $('Rolle').filter(function (
    this: cheerio.Element
  ) {
    return $(this).find('Rollennummer').text() === '1'
  })
  const beteiligung = rechtstraegerRolle.parent()
  const anschrift = beteiligung.find('Anschrift')
  // console.log(anschrift.html())
  const street =
    anschrift.find('Strasse').text() + ' ' + anschrift.find('Hausnummer').text()
  const zipCode = anschrift.find('Postleitzahl').text()
  const city = anschrift.find('Ort').text()
  const country = anschrift.find('Staat').text()

  console.log({ street, zipCode, city, country })
}
parseAddress()
