// We want to download the SI document and download the 'Liste der Gesellschafter' document

import { getSelectionCodes } from '../getSelectionCodes'
import { searchCompany } from '../searchCompany'
import { downloadDocument } from '../utils/downloadDocument'
import {
  postChargeInfo,
  postDocumentsDK,
  postErgebnisse,
} from '../utils/requests'

const main = async () => {
  let { results, cookie, viewState } = await searchCompany({
    queryString: 'cargokite',
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
  const codes = res.selectionCodes
  const listeDerGesellschafterCode = codes
    .get('Liste der Gesellschafter')![0][1]
    .trim()
  console.log('listeDerGesellschafterCode', listeDerGesellschafterCode)

  await postDocumentsDK({
    cookie,
    viewState,
    selection: listeDerGesellschafterCode,
    action: 'select',
  })
  await postDocumentsDK({
    cookie,
    viewState,
    selection: listeDerGesellschafterCode,
    action: 'submit',
  })

  downloadDocument(await postChargeInfo({ cookie, viewState }))
}
main()
