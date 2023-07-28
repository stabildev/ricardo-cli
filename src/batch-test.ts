import { getMultipleDocsForCompany } from './utils/getMultipleDocsForCompany'

const runTest = async () => {
  console.log('Starting test...')
  const startTime = Date.now()
  const [counter, company] = await getMultipleDocsForCompany({
    queryString: 'cargokite',
    registerType: 'HRB',
    registerNumber: '273489',
    documentTypes: ['DK', 'SI', 'AD'],
    selections: ['0_0_0_0', '0_0_0_1'],
  })
  const endTime = Date.now()
  console.log('Test finished!')
  console.log(
    `Downloaded ${counter} documents in ${(endTime - startTime) / 1000} s`
  )
  console.log('Company:')
  console.log(JSON.stringify(company, null, 2))
}

runTest()
