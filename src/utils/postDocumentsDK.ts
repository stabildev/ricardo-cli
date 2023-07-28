export const postDocumentsDK = async ({
  viewState,
  cookie,
  action = 'submit',
  asZip = false,
  selection = '0_0_0_0',
}: {
  viewState: string
  cookie: string
  action?: 'select' | 'submit'
  asZip?: boolean
  selection?: string
}): Promise<Response> => {
  if (action !== 'select' && action !== 'submit') {
    throw new Error('Invalid action!')
  }

  const headers = new Headers({
    'Accept': 'application/xml, text/xml, */*; q=0.01',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': cookie,
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

  const urlencodedData =
    action === 'select'
      ? new URLSearchParams({
          'javax.faces.partial.ajax': 'true',
          'dk_form': 'dk_form',
          'javax.faces.ViewState': viewState,
          'dk_form:dktree_selection': selection,
          'dk_form:dktree_scrollState': '0,0',
          'javax.faces.source': 'dk_form:dktree',
          'javax.faces.partial.execute': 'dk_form:dktree',
          'javax.faces.partial.render':
            'dk_form:detailsNodePanelGrid dk_form:dktree',
          'javax.faces.behavior.event': 'select',
          'javax.faces.partial.event': 'select',
          'dk_form:dktree_instantSelection': selection,
        })
      : new URLSearchParams({
          'javax.faces.partial.ajax': 'true',
          'dk_form': 'dk_form',
          'javax.faces.ViewState': viewState,
          'dk_form:dktree_selection': selection,
          'dk_form:dktree_scrollState': '0,0',
          'javax.faces.source': 'dk_form:j_idt154', // Submit Button
          'javax.faces.partial.execute': '@all',
          'dk_form:j_idt154': 'dk_form:j_idt154', // Submit Button
          'dk_form:radio_dkbuttons': asZip.toString(),
        })

  return await fetch(
    'https://www.handelsregister.de/rp_web/documents-dk.xhtml',
    {
      method: 'POST',
      headers,
      body: urlencodedData.toString(),
    }
  )
}
