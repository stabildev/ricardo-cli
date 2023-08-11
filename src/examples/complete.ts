import { getSelectionCodes } from '../getSelectionCodes'
import { extractCookie } from '../utils/extractCookie'
import { extractViewState, parseSearchResults } from '../utils/parse-utils'
import {
  getChargeInfo,
  getErgebnisse,
  postChargeInfo,
  postDocumentsDK,
  postErgebnisse,
  postNormaleSuche,
} from '../utils/requests'
import * as fs from 'fs'
import * as cheerio from 'cheerio'
import { parseSI } from '../utils/parseSI'

const main = async () => {
  // Nach Firmenname suchen
  const query = 'apple'

  let response = await postNormaleSuche({
    queryString: query,
  })
  const cookie = extractCookie(response)

  if (!cookie) {
    console.error('Cookie not found!')
    return
  }

  // Ergebnisse laden
  response = await getErgebnisse({ cookie })
  let { results, viewState } = parseSearchResults({
    html: await response.text(),
  })

  // Ergebnisse anzeigen
  console.log(results.map((result) => result.companyName))

  // Für Ergebnisse Dokumente laden: SI und Liste der Gesellschafter
  for (const result of results) {
    // Download and save SI
    await postErgebnisse({
      cookie,
      viewState,
      documentLink: result.documentLinks.SI!,
    })

    // Not sure if this is necessary
    response = await getChargeInfo({ cookie })
    viewState = extractViewState(cheerio.load(await response.text()))

    response = await postChargeInfo({
      cookie,
      viewState,
    })
    const xml = Buffer.from(await response.arrayBuffer()).toString()
    if (xml.length) {
      fs.writeFileSync(`./documents/SI_${result.companyName}.xml`, xml)

      // Parse SI
      const { name, hq, address } = parseSI(xml)
      console.log('Name: ' + name)
      console.log('HQ: ' + hq)
      console.log(address)
    }

    // Download and save Gesellschafterliste
    await postErgebnisse({
      cookie,
      viewState,
      documentLink: result.documentLinks.DK!,
    })

    const codes = await getSelectionCodes(['Liste der Gesellschafter'], {
      cookie,
      viewState,
    })
    viewState = codes.viewState
    const selectionCode = codes.result.get('Liste der Gesellschafter')

    if (!selectionCode) {
      console.error(
        'Liste der Gesellschafter not found for company ' + result.companyName
      )
      continue
    }

    await postDocumentsDK({
      cookie,
      viewState,
      selectionCode,
      action: 'select',
    })
    await postDocumentsDK({
      cookie,
      viewState,
      selectionCode,
      action: 'submit',
      buttonId: codes.buttonId,
    })

    // This is necessary
    response = await getChargeInfo({ cookie })
    viewState = extractViewState(cheerio.load(await response.text()))

    response = await postChargeInfo({
      cookie,
      viewState,
    })
    const fileExtension =
      response.headers
        .get('content-disposition')
        ?.match(/filename="(.+\.(.+))"/)?.[2] ?? 'unknown'
    fs.writeFileSync(
      `./documents/LdG_${result.companyName}.${fileExtension}`,
      Buffer.from(await response.arrayBuffer())
    )
  }
}
main()
