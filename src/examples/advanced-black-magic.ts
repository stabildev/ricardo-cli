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
  let { results, cookie, viewState } = await searchCompany({
    queryString: 'apple',
  })

  if (!results.length) throw new Error('No results found')

  const company = results[0]

  console.log(company.companyName)

  // Download SI document
  await postErgebnisse({
    cookie,
    viewState,
    documentLink: results[0].documentLinks.SI!,
  })

  downloadDocument(await postChargeInfo({ cookie, viewState }))

  // Download 'Liste der Gesellschafter' document
  await postErgebnisse({
    cookie,
    viewState,
    documentLink: results[0].documentLinks.DK!,
  })

  const res = await getSelectionCodes({ cookie, viewState })
  cookie = res.cookie
  viewState = res.viewState
  const buttonId = res.buttonId
  console.log('buttonId', buttonId)

  // Select most recent document [0] of type 'Liste der Gesellschafter'
  // First element is document name, second element [1] is selection code
  const selectionCode = res.selectionCodes.get(
    'Liste der Gesellschafter'
  )![0][1]
  console.log('selectionCode', selectionCode)

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
  console.log('viewState', viewState)

  // Download document
  downloadDocument(await postChargeInfo({ cookie, viewState }))
}
main()
