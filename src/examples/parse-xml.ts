import * as fs from 'fs'
import * as cheerio from 'cheerio'
import { searchCompany } from '../searchCompany'
import { postChargeInfo, postErgebnisse } from '../utils/requests'

const getThirdRoll = async () => {
  // Search for company
  const { results, cookie, viewState } = await searchCompany({
    queryString: 'apple',
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

  fs.writeFileSync('documents/SI.xml', xml)

  // Extract <Rolle> with Rollennummer 3
  const $ = cheerio.load(xml, { xmlMode: true })
  const thirdRoll = $('Rolle').filter(function (this: cheerio.Element) {
    return $(this).find('Rollennummer').text() === '3'
  })

  console.log(thirdRoll.html())
}
getThirdRoll()
