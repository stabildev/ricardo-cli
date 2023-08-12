import { SearchResult, RegisterType, RegisterDocumentType } from './types'
import * as cheerio from 'cheerio'

export const parseResults = ({
  html,
  includeHistory = false,
}: {
  html: string
  includeHistory?: boolean
}) => {
  const $ = cheerio.load(html)
  const viewState = extractViewState($)

  let results: SearchResult[] = []

  $('tbody#ergebnissForm\\:selectedSuchErgebnisFormTable_data > tr').each(
    function (this: cheerio.Element) {
      const result = $(this)
      const tbody = result.find('tbody').first()

      if (!tbody.length) return

      // Every inner tbody has three rows
      const trs = tbody.children()

      // The first row contains the state and the Amtsgericht in a single cell
      const firstRow = trs.eq(0)
      const tdContents = firstRow.find('td').contents()
      const state = tdContents.eq(0).text().trim()
      const registerCourtAndNumber = tdContents.eq(1).text().trim()

      const { registerNumber, registerType } = extractRegisterNumberAndType(
        registerCourtAndNumber
      )

      // The second row contains the name and the city and the status,
      // each in a separate cell
      const secondRow = trs.eq(1)
      const secondRowCells = secondRow.find('td')

      const [name, city, status] = [
        secondRowCells.eq(0).text().trim(),
        secondRowCells.eq(1).text().trim(),
        secondRowCells.eq(2).text().trim() as SearchResult['status'],
      ]

      // The fourth cell of the second row contains the document links with the idt value
      // The children of the cell are either links with nested spans or just spans if no link is available
      // Use spans instead of links because not all links are available
      const documentLinks = new Map<RegisterDocumentType, string | null>()
      secondRowCells
        .eq(3)
        .find('span')
        .each((_, el) => {
          const span = $(el)
          documentLinks.set(
            span.text().trim() as RegisterDocumentType,
            (span.parent().is('a') && span.parent().attr('id')) || null
          )
        })

      let history: SearchResult['history'] = undefined
      if (includeHistory) {
        // The history is in the third row
        const thirdRow = trs.eq(2)
        if (thirdRow.length) {
          // The first "table" is the header. The second table is the actual table
          const historyRows = thirdRow
            .find('table:nth-child(2) > tbody')
            .children()
            .toArray()
          history = historyRows.map((historyRow, i) => {
            // The first two cells contain the relevant data
            // Remove the preceding 1.), 2.), etc.
            const rowData = $(historyRow)
              .find('td')
              .toArray()
              .slice(0, 2)
              .map((td) =>
                $(td)
                  .text()
                  .trim()
                  .replace(`${i + 1}.) `, '')
              )
            return {
              name: rowData[0],
              city: rowData[1],
            }
          })
        }
      }

      results.push({
        name,
        city,
        state,
        registerCourtAndNumber: registerCourtAndNumber,
        registerNumber: registerNumber!,
        registerType: registerType!,
        status,
        ...(history ? { history } : {}),
        documentLinks,
      })
    }
  )
  return { results, viewState }
}

export function extractViewState($: cheerio.Root): string
export function extractViewState(html: string): string
export function extractViewState(input: cheerio.Root | string) {
  const $ = typeof input === 'string' ? cheerio.load(input) : input

  const value = $('input[name="javax.faces.ViewState"]').val()
  if (!value) {
    throw new Error('Failed to extract view state')
  }
  return value as string
}

export const extractButtonId = ($: cheerio.Root) => {
  const id = $('button').attr('id')

  if (!id) {
    throw new Error('Failed to extract button id')
  }
  return id
}

// Must expand top level node '0_0' first!
export const extractAvailableDkDocuments = ($: cheerio.Root) => {
  const result = new Map<string, string>() // e. g. 'Liste der Gesellschafter' => '0_0_1'
  const topLevelNodes = $('#dk_form\\:dktree\\:0_0 > ul > li').toArray()
  for (const node of topLevelNodes) {
    const docName = $(node).text()
    const selectionCode = $(node).attr('data-rowkey')
    if (docName && selectionCode) {
      result.set(docName, selectionCode)
    }
  }
  return result
}

export const extractSelectionCode = ($: cheerio.Root, topLevelCode: string) => {
  // Find first leaf under specified top level
  const documentNode = $(
    `#dk_form\\:dktree\\:${topLevelCode} li.ui-treenode-leaf`
  ).first()

  if (!documentNode.length) {
    return null
  }

  const selectionCode = documentNode.attr('data-rowkey')
  if (!selectionCode) {
    throw new Error('Failed to extract selection code')
  }
  return selectionCode
}

export const extractRegisterNumberAndType = (
  registerCourtAndNumber?: string
): {
  registerNumber: string | undefined
  registerType: RegisterType | undefined
} => {
  if (!registerCourtAndNumber)
    return { registerNumber: undefined, registerType: undefined }
  let registerNumber: string | undefined
  let registerType: RegisterType | undefined

  if (registerCourtAndNumber) {
    // String format: "Amtsgericht Mönchengladbach VR 1234 früher Amtsgericht Viersen"
    for (const key in RegisterType) {
      const regex = new RegExp(`${key}\\s+(\\d+)`)
      const match = registerCourtAndNumber.match(regex)

      if (match) {
        registerNumber = match[1]
        registerType = RegisterType[key as keyof typeof RegisterType]
      }
    }
  }
  return { registerNumber: registerNumber, registerType: registerType }
}

export const extractFileName = (
  contentDisposition: string | null
): [string | null, string | null] => {
  if (!contentDisposition) {
    return [null, null]
  }
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
  const matches = filenameRegex.exec(contentDisposition)
  const fileName = matches?.[1].replace(/['"]/g, '') || null
  const fileExtension = fileName?.split('.').pop() || null
  return [fileName, fileExtension]
}

export const extractCookie = (response: Response): string => {
  const cookies = response.headers.get('set-cookie')

  const sessionCookie = cookies
    ?.split(';')
    .find((cookie) => cookie.includes('JSESSIONID='))

  if (!sessionCookie) {
    throw new Error('Failed to extract cookie')
  }
  return sessionCookie
}

export const preprocessXML = (xml: string) => {
  // Remove namespaces
  xml = xml.replace(/<(\w+:)/g, '<').replace(/<\/(\w+:)/g, '</')

  // Remove underscores and dots within tags
  xml = xml.replace(/<(\/?[^>]*?)[_.]/g, '<$1')
  return xml
}

export const parseSI = (xml: string) => {
  const cleanXml = preprocessXML(xml)
  const $ = cheerio.load(cleanXml, {
    xmlMode: true,
    lowerCaseTags: true,
    normalizeWhitespace: true,
  })

  let rechtstraeger = $('grunddaten > verfahrensdaten > beteiligung > rolle')
    .filter((_, el) => $(el).find('rollennummer').text() === '1')
    .parent()
    .find('beteiligter')

  // Fall back to fachdatenregister if no rechtstraeger is found
  if (!rechtstraeger.length) {
    rechtstraeger = $('fachdatenregister > basisdatenregister > rechtstraeger')
  }

  const name = rechtstraeger.find('bezeichnungaktuell').text()
  const hq = rechtstraeger.find('sitz > ort').text()
  const anschrift = rechtstraeger.find('anschrift')
  const street = anschrift.find('strasse').text()
  const number = anschrift.find('hausnummer').text()
  const zip = anschrift.find('postleitzahl').text()
  const city = anschrift.find('ort').text()
  const countryCode =
    anschrift.find('staat code').text() ||
    anschrift.find('staat content').text() ||
    rechtstraeger.find('sitz > staat code').text() ||
    rechtstraeger.find('sitz > staat content').text()

  return {
    name,
    hq,
    address: {
      street,
      number,
      zip,
      city,
      countryCode,
    },
  }
}

export const containsXML = (str: string) => {
  // Check if string contains XML
  const xmlRegex =
    /^<\?xml\s+version=["'][^"']*["']\s*(encoding=["'][^"']*["'])?\s*\?>/

  try {
    return xmlRegex.test(str)
  } catch (error) {
    console.error('Error while testing regular expression:', error)
    return false
  }
}
