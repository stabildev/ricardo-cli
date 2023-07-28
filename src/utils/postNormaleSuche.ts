export const postNormaleSuche = async ({
  queryString,
  registerType,
  registerNumber,
}: {
  queryString?: string
  registerType?: 'HRA' | 'HRB' | 'PR' | 'VR' | 'GnR'
  registerNumber?: string
}) => {
  if (!queryString && !(!!registerType && !!registerNumber)) {
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
    'form:schlagwortOptionen': '2',
    'form:NiederlassungSitz': '',
    'form:registerArt_focus': registerType ?? '',
    'form:registerArt_input': '',
    'form:registerNummer': registerNumber ?? '',
    'form:registergericht_focus': '',
    'form:registergericht_input': '',
    'form:ergebnisseProSeite_focus': '',
    'form:ergebnisseProSeite_input': '10',
  })

  return await fetch(
    'https://www.handelsregister.de/rp_web/normalesuche.xhtml',
    {
      method: 'POST',
      headers: headers,
      body: urlencodedData.toString(),
      redirect: 'manual',
    }
  )
}
