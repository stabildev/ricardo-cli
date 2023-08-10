import * as fs from 'fs'
import { searchCompany } from '../searchCompany'
import { getSelectionCodes } from '../getSelectionCodes'
import { postErgebnisse } from '../utils/requests'

const main = async () => {
  let { results, cookie, viewState } = await searchCompany({
    queryString: 'apple',
  })
  console.log(`Found ${results.length} results`)

  let allSelectionCodes: Awaited<
    ReturnType<typeof getSelectionCodes>
  >['selectionCodes'][] = []

  for (const result of results) {
    console.log(`Getting selection codes for ${result.companyName}`)
    // Select search result
    await postErgebnisse({
      viewState,
      cookie,
      documentLink: result.documentLinks.DK!,
    })

    // get selection codes map
    const res = await getSelectionCodes({
      cookie,
      viewState,
    })

    const selectionCodes = res.selectionCodes
    console.log('selectionCodes', selectionCodes)
    viewState = res.viewState // update viewState
    console.log('viewState', viewState)
    cookie = res.cookie // update cookie
    console.log('cookie', cookie)

    allSelectionCodes.push(selectionCodes)
  }

  fs.writeFileSync(
    './documents/documentCodes.json',
    JSON.stringify(allSelectionCodes.map((map) => Array.from(map.entries())))
  )
  console.log(
    new Set(
      allSelectionCodes
        .map((map) => Array.from(map.entries()).map(([k, v]) => k))
        .flat()
    )
  )
}
main()
