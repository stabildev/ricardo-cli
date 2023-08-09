import { CompanySearchResult, RegistryType } from './types'
import { extractCookie } from './utils/extractCookie'
import { getErgebnisse, postNormaleSuche } from './utils/requests'
import { parseSearchResults } from './utils/parse-utils'

export const searchCompany = async ({
  queryString,
  registryType,
  registryNumber,
  cookie,
  includeHistory = false,
}: {
  queryString: string
  registryType?: RegistryType
  registryNumber?: string
  cookie?: string
  includeHistory?: boolean
}): Promise<{
  results: CompanySearchResult[]
  cookie: string
  viewState: string
}> => {
  let response = await postNormaleSuche({
    queryString,
    registryType,
    registryNumber,
    cookie,
  })

  cookie = cookie ?? extractCookie(response)
  if (!cookie) {
    throw new Error('No cookie found!')
  }

  response = await getErgebnisse({ cookie })
  const html = await response.text()
  const { results, viewState } = parseSearchResults({ html, includeHistory })

  return {
    results,
    cookie,
    viewState,
  }
}
