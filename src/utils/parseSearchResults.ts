export interface CompanySearchResult {
  companyName?: string
  city?: string
  state?: string
  registryCourtAndNumber?: string
  status?: string
  history?: string[][]
  documentLinks: {
    'AD': string | null
    'CD': string | null
    'HD': string | null
    'DK': string | null
    'UT': string | null
    'VÖ': string | null
    'SI': string | null
  }
}

export const parseSearchResults = (
  document: Document
): CompanySearchResult[] => {
  let results: CompanySearchResult[] = []

  const companyRows = document.querySelectorAll(
    'tbody#ergebnissForm\\:selectedSuchErgebnisFormTable_data > tr'
  )

  for (const companyRow of companyRows) {
    // Get inner tbody
    const tbody = companyRow.querySelector('tbody')

    if (!tbody) continue

    // Every inner tbody has three rows
    const trs = [...tbody.children]

    // The first row contains the state and the Amtsgericht in a single cell
    const firstRow = trs[0]
    const [state, registryCourtAndNumber] = [
      ...firstRow.querySelector('td')!.childNodes,
    ].map((node) => node.textContent?.trim())

    // The second row contains the company name and the city and the status,
    // each in a separate cell
    const secondRow = trs[1]
    const secondRowCells = [...secondRow.querySelectorAll('td')]
    const [companyName, city, status] = secondRowCells.map((node) =>
      node.textContent?.trim()
    )

    // The fourth cell of the second row contains the document links with the idt value
    // The children of the cell are either links with nested spans or just spans if no link is available
    // Use spans instead of links because not all links are available
    const documentLinks = [...secondRowCells[3].querySelectorAll('span')].map(
      (span) => [
        span.textContent,
        (span.parentNode as HTMLElement).tagName === 'A'
          ? (span.parentNode as HTMLElement).id
          : null,
      ]
    )

    // The third row is optional and contains historic company names and cities
    const thirdRow = trs[2]
    let history: CompanySearchResult['history']
    if (thirdRow) {
      // The first "table" is the header. The second table is the actual table
      const historyTable = thirdRow.querySelector('table:nth-child(2) > tbody')
      const historyRows = historyTable ? [...historyTable.children] : null
      history = historyRows?.map((historyRow, i) =>
        [...historyRow.querySelectorAll('td')]
          .slice(0, 2)
          .map(
            (node) => node.textContent?.trim().replace(`${i + 1}.) `, '') ?? ''
          )
      )
    }

    const company = {
      companyName,
      city,
      state,
      registryCourtAndNumber,
      status,
      history,
      documentLinks: Object.fromEntries(documentLinks),
    }

    results.push(company)
  }
  return results
}
