import { RegisterType } from './types'

export const postNormaleSuche = async ({
  queryString,
  registerType: registryType,
  registerNumber,
  cookie,
  exactMatch = false,
}: {
  queryString?: string
  registerType?: RegisterType
  registerNumber?: string
  cookie?: string
  exactMatch?: boolean
}) => {
  if (!queryString && !(!!registryType && !!registerNumber)) {
    throw new Error('No search string or no register type and number provided!')
  }
  const headers = new Headers({
    'Accept': 'application/xml, text/xml, */*; q=0.01',
    'Accept-Language': 'de-DE,de;q=0.9',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Faces-Request': 'partial/ajax',
    'Origin': 'https://www.handelsregister.de',
    'Referer': 'https://www.handelsregister.de/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    ...(cookie ? { 'Cookie': cookie } : {}),
  })

  const urlencodedData = new URLSearchParams({
    'javax.faces.partial.ajax': 'true',
    'javax.faces.source': 'form:btnSuche',
    'javax.faces.partial.execute': '@all',
    'javax.faces.partial.render': 'form',
    'form:btnSuche': 'form:btnSuche',
    'form': 'form',
    'javax.faces.ViewState': 'stateless',
    'suchTyp': 'n',
    'form:schlagwoerter': queryString ?? '',
    'form:schlagwortOptionen': exactMatch ? '3' : '1', // default is '2' which means only one word has to match. Useless!
    'form:NiederlassungSitz': '',
    'form:registerArt_focus': registryType ?? '',
    'form:registerArt_input': '',
    'form:registerNummer': registerNumber ?? '',
    'form:registergericht_focus': '',
    'form:registergericht_input': '',
    'form:ergebnisseProSeite_focus': '',
    'form:ergebnisseProSeite_input': '10',
  })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/normalesuche.xhtml',
    {
      method: 'POST',
      headers: headers,
      body: urlencodedData.toString(),
      redirect: 'follow',
    }
  )
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

export const getErgebnisse = async ({ cookie }: { cookie: string }) => {
  const headers = new Headers({
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'de-DE,de;q=0.9',
    'Referer': 'https://www.handelsregister.de/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': cookie,
  })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/ergebnisse.xhtml',
    {
      method: 'GET',
      headers: headers,
      redirect: 'follow',
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

export const postErgebnisse = async ({
  viewState,
  cookie,
  documentLink,
}: {
  viewState: string
  cookie: string
  documentLink: string
}): Promise<Response> => {
  const headers = new Headers({
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'max-age=0',
    'Origin': 'https://www.handelsregister.de',
    'Referer': 'https://www.handelsregister.de/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
  })

  const urlencodedData = new URLSearchParams({
    'ergebnissForm': 'ergebnissForm',
    'javax.faces.ViewState': viewState,
    'ergebnissForm:selectedSuchErgebnisFormTable_rppDD': '10',
    [documentLink]: documentLink,
  })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/ergebnisse.xhtml',
    {
      method: 'POST',
      headers: headers,
      body: urlencodedData,
      redirect: 'manual',
    }
  )

  // Should return 302 Found
  if (response.status !== 302) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

// Not needed
export const getDocumentsDK = async ({
  cookie,
}: {
  cookie: string
}): Promise<Response> => {
  const headers = new Headers({
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'max-age=0',
    'Cookie': cookie,
    'Referer': 'https://www.handelsregister.de/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',

    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',

    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/documents-dk.xhtml',
    {
      method: 'GET',
      headers,
      redirect: 'follow',
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

export const postDocumentsDK = async ({
  viewState,
  cookie,
  action,
  asZip = false,
  selectionCode,
  buttonId,
}: {
  viewState: string
  cookie: string
  action: 'select' | 'submit'
  asZip?: boolean
  selectionCode: string
  buttonId?: string
}): Promise<Response> => {
  if (action === 'submit' && !buttonId) {
    throw new Error('No buttonId provided!')
  }

  const headers = new Headers({
    'Accept': 'application/xml, text/xml, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Accept-Language': 'de-DE,de;q=0.9',
    // Content-Length: 436
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': cookie,
    'Faces-Request': 'partial/ajax',
    'Host': 'www.handelsregister.de',
    'Origin': 'https://www.handelsregister.de',
    'Referer': 'https://www.handelsregister.de/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  })

  const urlencodedData =
    action === 'select'
      ? new URLSearchParams({
          'javax.faces.partial.ajax': 'true',
          'dk_form': 'dk_form',
          'javax.faces.ViewState': viewState,
          'dk_form:dktree_selection': selectionCode,
          'dk_form:dktree_scrollState': '0,0',
          'javax.faces.source': 'dk_form:dktree',
          'javax.faces.partial.execute': 'dk_form:dktree',
          'javax.faces.partial.render':
            'dk_form:detailsNodePanelGrid dk_form:dktree',
          'javax.faces.behavior.event': 'select',
          'javax.faces.partial.event': 'select',
          'dk_form:dktree_instantSelection': selectionCode,
        })
      : new URLSearchParams({
          'javax.faces.partial.ajax': 'true',
          'javax.faces.source': buttonId!, // Submit Button
          'javax.faces.partial.execute': '@all',
          [buttonId!]: buttonId!, // Submit Button
          'dk_form': 'dk_form',
          'javax.faces.ViewState': viewState,
          'dk_form:dktree_selection': selectionCode,
          'dk_form:dktree_scrollState': '0,0',
          'dk_form:radio_dkbuttons': asZip.toString(),
        })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/documents-dk.xhtml',
    {
      method: 'POST',
      headers,
      body: urlencodedData.toString(),
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

// Not needed
export const getChargeInfo = async ({
  cookie,
}: {
  cookie: string
}): Promise<Response> => {
  const headers = new Headers({
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'max-age=0',
    'Referer': 'https://www.handelsregister.de/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': cookie,
  })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/chargeinfo.xhtml',
    {
      method: 'GET',
      headers,
      redirect: 'follow',
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

export const postChargeInfo = async ({
  viewState,
  cookie,
}: {
  viewState: string
  cookie: string
}): Promise<Response> => {
  const headers = new Headers({
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'de-DE,de;q=0.9',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    // Content-Length
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': cookie,
    'Host': 'www.handelsregister.de',
    'Origin': 'https://www.handelsregister.de',
    'Referer': 'https://www.handelsregister.de/',
    'sec-ch-ua':
      '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  })

  const urlencodedData = new URLSearchParams({
    'form': 'form',
    'javax.faces.ViewState': viewState,
    'suchTyp': 'n',
    'form:geschaeftszeichen': '',
    'form:kostenpflichtigabrufen': '',
  })

  const response = await fetch(
    'https://www.handelsregister.de/rp_web/chargeinfo.xhtml',
    {
      method: 'POST',
      headers,
      body: urlencodedData.toString(),
      redirect: 'manual',
    }
  )

  if (!response.ok && response.status !== 302) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}
