import { extractCookie, parseResults } from '../lib/parse-utils'
import { getErgebnisse, postNormaleSuche } from '../lib/requests'

export const search = async (
  queryString: string,
  options?: { cookie?: string; includeHistory?: boolean }
) => {
  let { cookie, includeHistory } = options ?? {}

  let response = await postNormaleSuche({
    queryString,
    cookie,
  })
  cookie = extractCookie(response)
  response = await getErgebnisse({
    cookie,
  })
  const { results, viewState } = parseResults({
    html: await response.text(),
    includeHistory,
  })
  return { results, viewState, cookie }
}
