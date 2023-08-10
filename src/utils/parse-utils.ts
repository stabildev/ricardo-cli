import { CompanySearchResult, RegistryType } from '../types'
import * as cheerio from 'cheerio'

export const parseSearchResults = ({
  html,
  includeHistory = false,
}: {
  html: string
  includeHistory?: boolean
}) => {
  const $ = cheerio.load(html)
  let results: CompanySearchResult[] = []

  $('tbody#ergebnissForm\\:selectedSuchErgebnisFormTable_data > tr').each(
    function (this: cheerio.Element) {
      const companyRow = $(this)
      const tbody = companyRow.find('tbody').first()

      if (!tbody.length) return

      // Every inner tbody has three rows
      const trs = tbody.children()

      // The first row contains the state and the Amtsgericht in a single cell
      const firstRow = trs.eq(0)
      const tdContents = firstRow.find('td').contents()
      const state = tdContents.eq(0).text().trim()
      const registryCourtAndNumber = tdContents.eq(1).text().trim()

      const { registryNumber, registryType } = extractRegistryNumberAndType(
        registryCourtAndNumber
      )

      // The second row contains the company name and the city and the status,
      // each in a separate cell
      const secondRow = trs.eq(1)
      const secondRowCells = secondRow.find('td')

      const [companyName, city, status] = [
        secondRowCells.eq(0).text().trim(),
        secondRowCells.eq(1).text().trim(),
        secondRowCells.eq(2).text().trim(),
      ]

      // The fourth cell of the second row contains the document links with the idt value
      // The children of the cell are either links with nested spans or just spans if no link is available
      // Use spans instead of links because not all links are available
      const documentLinks: [string, string | undefined][] = []
      secondRowCells
        .eq(3)
        .find('span')
        .each((_, el) => {
          const span = $(el)
          documentLinks.push([
            span.text().trim(),
            span.parent().is('a') ? span.parent().attr('id') : undefined,
          ])
        })

      let history: CompanySearchResult['history'] = undefined
      if (includeHistory) {
        const thirdRow = trs.eq(2)
        if (thirdRow.length) {
          // The first "table" is the header. The second table is the actual table
          const historyRows = thirdRow
            .find('table:nth-child(2) > tbody')
            .children()
            .toArray()
          history = historyRows.map((historyRow, i) => {
            const texts: string[] = []
            $(historyRow)
              .find('td')
              .slice(0, 2)
              .each((_, cell) => {
                texts.push(
                  $(cell)
                    .text()
                    .trim()
                    .replace(`${i + 1}.) `, '')
                )
              })
            return texts
          })
        }
      }

      results.push({
        companyName,
        city,
        state,
        registryCourtAndNumber,
        registryNumber,
        registryType,
        status,
        ...(history ? { history } : {}),
        documentLinks: Object.fromEntries(
          documentLinks
        ) as CompanySearchResult['documentLinks'],
      })
    }
  )
  const viewState = extractViewState($)
  return { results, viewState }
}

export const extractViewState = ($: cheerio.Root): string => {
  const inputElement = $('input[name="javax.faces.ViewState"]')
  const value = inputElement.val()

  if (!value) {
    throw new Error('Failed to extract view state')
  }
  return value as string
}

export const extractRegistryNumberAndType = (
  registryCourtAndNumber?: string
): {
  registryNumber: string | undefined
  registryType: RegistryType | undefined
} => {
  if (!registryCourtAndNumber)
    return { registryNumber: undefined, registryType: undefined }
  let registryNumber: string | undefined
  let registryType: RegistryType | undefined

  if (registryCourtAndNumber) {
    // String format: "Amtsgericht Mönchengladbach VR 1234 früher Amtsgericht Viersen"
    for (const key in RegistryType) {
      const regex = new RegExp(`${key}\\s+(\\d+)`)
      const match = registryCourtAndNumber.match(regex)

      if (match) {
        registryNumber = match[1]
        registryType = RegistryType[key as keyof typeof RegistryType]
      }
    }
  }
  return { registryNumber, registryType }
}
