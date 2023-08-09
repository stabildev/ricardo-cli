import { searchCompany } from '../searchCompany'
import { fetchDocumentsWithViewState } from '../fetchDocuments'

// Search for company 'apple' and download 'SI' document

// Wrapped in async function to use await
const main = async () => {
  const { results, cookie, viewState } = await searchCompany({
    queryString: 'apple',
  })

  // Documents will be saved to documents folder
  fetchDocumentsWithViewState({
    documents: ['SI'],
    cookie,
    viewState,
    company: results[0], // select first result
  })
}

main()
