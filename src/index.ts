import { searchCompany } from './utils/searchCompany'
import { fetchDocumentsWithViewState } from './utils/fetchDocuments'

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
    company: results[0],
  })
}

main()
