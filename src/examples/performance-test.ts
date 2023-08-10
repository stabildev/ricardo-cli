import { RegistryDocument } from '../types'
import { fetchDocumentsWithViewState } from '../fetchDocuments'
import { searchCompany } from '../searchCompany'

const query = 'apple'

const main = async () => {
  // Search for company
  console.log(`Searching for ${query}...`)
  let startTime = Date.now()
  const { results, cookie, viewState } = await searchCompany({
    queryString: query,
  })
  let endTime = Date.now()

  console.log(`Found ${results.length} results in ${endTime - startTime}ms`)

  // Display results
  if (!results.length) return

  results.forEach((result, index) => {
    console.log(`${index + 1}.) ${result.companyName}`)
  })

  // Select first company and download documents
  const company = results[0]
  const { companyName, registryNumber, registryType } = company
  const documents: RegistryDocument[] = ['SI'] // ['SI', 'AD', 'DK'] // Strukturierter Inhalt, Aktueller Abdruck, DK-Dokumente
  // const dkDocuments = ['0_0_0_0', '0_0_1_0'] // i.d.R. Gesellschaftsvertrag, Gesellschafterliste

  console.log(`Downloading documents for ${companyName}...`)
  startTime = Date.now()
  const numberOfDocuments = await fetchDocumentsWithViewState({
    documents,
    // dkDocumentSelections: dkDocuments,
    cookie,
    viewState,
    company,
    // companyName: companyName!,
    // registryNumber: registryNumber!,
    // registryType: registryType!,
  })
  endTime = Date.now()

  console.log(
    `Downloaded ${numberOfDocuments} documents in ${endTime - startTime}ms`
  )
}

main()