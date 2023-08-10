import { searchCompany } from '../searchCompany'
import { downloadDocument } from '../utils/downloadDocument'
import { postChargeInfo, postErgebnisse } from '../utils/requests'

const sendToProxy = async (fn: (arg0: any) => Promise<any>): Promise<any> => {
  // todo: route through proxy server
  throw new Error('Not implemented')
}

const main = async () => {
  const { results, cookie, viewState } = await searchCompany({
    queryString: 'apple',
  })

  console.log(`From ${results.length} results:`)

  await Promise.all(
    results.map((result) =>
      sendToProxy(async () => {
        await postErgebnisse({
          cookie,
          viewState,
          documentLink: result.documentLinks.SI!,
        })
        return await postChargeInfo({
          cookie,
          viewState,
        })
      }).then((response) =>
        downloadDocument(response).then((fileName) => {
          console.log(`Downloaded ${fileName}`)
        })
      )
    )
  )

  console.log('Finished all downloads')

  //   await postErgebnisse({
  //     cookie,
  //     viewState,
  //     documentLink: results[0].documentLinks.SI,
  //   })

  //   downloadDocument(
  //     await postChargeInfo({
  //       cookie,
  //       viewState,
  //     })
  //   )

  //   console.time('downloadDocument')
  //   for (const result of results) {
  //     // Wait for document selection to finish
  //     await postErgebnisse({
  //       cookie,
  //       viewState,
  //       documentLink: result.documentLinks.SI,
  //     })
  //     // Don't wait for document download to finish
  //     const response = await postChargeInfo({
  //       cookie,
  //       viewState,
  //     })
  //     downloadDocument(response).then((fileName) => {
  //       console.log(`Downloaded ${fileName}`)
  //     })
  //   }
  //   console.timeEnd('downloadDocument')
}

main()
