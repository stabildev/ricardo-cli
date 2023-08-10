import * as fs from 'fs'
import * as cheerio from 'cheerio'

const parseAddress = () => {
  if (!fs.existsSync('./documents/SI.xml')) {
    console.error('SI.xml does not exist')
    throw new Error('./documents/SI.xml does not exist, make sure to add it')
  }
  const xml = fs.readFileSync('./documents/SI.xml')
  const $ = cheerio.load(xml, {
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
