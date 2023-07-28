import { CompanySearchResult, RegistryType } from '../types'

export const parseSearchResults = ({
  document,
  includeHistory = false,
}: {
  document: Document
  includeHistory?: boolean
}): CompanySearchResult[] => {
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

    const { registryNumber, registryType } = extractRegistryNumberAndType(
      registryCourtAndNumber
    )

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
          : undefined,
      ]
    )

    // The third row is optional and contains historic company names and cities
    let history: CompanySearchResult['history'] = undefined

    if (includeHistory) {
      const thirdRow = trs[2]
      if (thirdRow) {
        // The first "table" is the header. The second table is the actual table
        const historyTable = thirdRow.querySelector(
          'table:nth-child(2) > tbody'
        )
        const historyRows = historyTable ? [...historyTable.children] : null
        history = historyRows?.map((historyRow, i) =>
          [...historyRow.querySelectorAll('td')]
            .slice(0, 2)
            .map(
              (node) =>
                node.textContent?.trim().replace(`${i + 1}.) `, '') ?? ''
            )
        )
      }
    }

    const company = {
      companyName,
      city,
      state,
      registryCourtAndNumber,
      registryNumber,
      registryType,
      status,
      ...(history ? { history } : {}),
      documentLinks: Object.fromEntries(documentLinks),
    }

    results.push(company)
  }
  return results
}

export const extractUrlPathWithSecIp = (document: Document): string => {
  const formElement: HTMLFormElement | null =
    document.querySelector('form#ergebnissForm')
  const action = formElement?.action

  if (!action) {
    throw new Error('Failed to extract url path with sec ip')
  }
  return action
}

export const extractViewState = (document: Document): string => {
  const inputElement: HTMLInputElement | null = document.querySelector(
    'input[name="javax.faces.ViewState"]'
  )
  const value = inputElement?.value

  if (!value) {
    throw new Error('Failed to extract view state')
  }
  return value
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
