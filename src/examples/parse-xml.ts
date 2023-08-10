import * as fs from 'fs'
import * as cheerio from 'cheerio'

const getThirdRoll = () => {
  const xml = fs.readFileSync('./documents/SI.xml', 'utf8')
  const $ = cheerio.load(xml, { xmlMode: true })

  const thirdRoll = $('Rolle').filter(function (this: cheerio.Element) {
    return $(this).find('Rollennummer').text() === '3'
  })

  console.log(thirdRoll.html())
}
getThirdRoll()
