import { searchCompany } from '../searchCompany'

// Search for company 'apple' and log results

// Wrapped in async function to use await
const main = async () => {
  const { results, cookie, viewState } = await searchCompany({
    queryString: 'apple',
  })

  console.log(results)
  console.log(cookie)
  console.log(viewState)
}

main()
