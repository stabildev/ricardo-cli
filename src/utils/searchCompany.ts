import { JSDOM } from 'jsdom'
import { CompanySearchResult, RegistryType } from '../types'
import { extractCookie } from './cookies'
import { getErgebnisse, postNormaleSuche } from './requests'
import { extractViewState, parseSearchResults } from './parse-utils'

export const searchCompany = async ({
  queryString,
  registryType,
  registryNumber,
  cookie,
  includeHistory = false,
}: {
  queryString?: string
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
  const text = await response.text()
  const dom = new JSDOM(text)
  const document = dom.window.document

  const results = parseSearchResults({ document, includeHistory })
  const viewState = extractViewState(document)

  return {
    results,
    cookie,
    viewState,
  }
}
