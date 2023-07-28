export const postErgebnisse = async ({
  viewState,
  cookie,
  documentLink,
  urlPathWithSecIp,
}: {
  viewState: string
  cookie: string
  documentLink: string
  urlPathWithSecIp: string
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

  return await fetch(`https://www.handelsregister.de${urlPathWithSecIp}`, {
    method: 'POST',
    headers: headers,
    body: urlencodedData,
    redirect: 'manual',
  })
}
