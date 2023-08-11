// We want to download the SI document and the 'Liste der Gesellschafter' document

import { getSelectionCodes } from '../getSelectionCodes'
import { searchCompany } from '../searchCompany'
import { downloadDocument } from '../utils/downloadDocument'
import { extractViewState } from '../utils/parse-utils'
import * as cheerio from 'cheerio'
import {
  getChargeInfo,
  postChargeInfo,
  postDocumentsDK,
  postErgebnisse,
} from '../utils/requests'

const main = async () => {
  const query = 'zimmermann'

  console.log(`Searching for company "${query}"...`)
  let { results, cookie, viewState } = await searchCompany({
    queryString: query,
  })

  if (!results.length) throw new Error('No results found')

  console.log(`Found ${results.length} results`)

  const company = results[0]

  console.log('Company name: ' + company.companyName)

  // Download SI document
  console.log('Downloading SI document...')
  await postErgebnisse({
    cookie,
    viewState,
    documentLink: results[0].documentLinks.SI!,
  })

  downloadDocument(await postChargeInfo({ cookie, viewState }))
  console.log('Done!')

  // Download 'Liste der Gesellschafter' document
  console.log('Downloading "Liste der Gesellschafter" document...')
  await postErgebnisse({
    cookie,
    viewState,
    documentLink: results[0].documentLinks.DK!,
  })

  const res = await getSelectionCodes(['Liste der Gesellschafter'], {
    cookie,
    viewState,
  })
  cookie = res.cookie
  viewState = res.viewState
  const buttonId = res.buttonId

  const selectionCode = res.result.get('Liste der Gesellschafter')

  if (!selectionCode) throw new Error('No selection code found')

  // Perform two-step document selection
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
    buttonId,
  })

  // Ohne neuen viewState funktioniert das nicht
  const res2 = await getChargeInfo({ cookie })
  viewState = extractViewState(cheerio.load(await res2.text()))

  // Download document
  downloadDocument(await postChargeInfo({ cookie, viewState }))
  console.log('Done!')
}
main()
