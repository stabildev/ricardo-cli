import prompts from 'prompts'
import { search } from './lib/search'
import { DkDocument, RegisterDocument, SearchResult } from './lib/types'
import { parseSI } from './lib/parse-utils'
import { requestDocument } from './lib/requestDocument'

const displayDetails = async (
  selectedResult: SearchResult,
  {
    cookie,
    viewState,
    results,
  }: { cookie: string; viewState: string; results: SearchResult[] }
) => {
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do next?',
    choices: [
      { title: 'Download and parse SI document', value: 'SI' },
      { title: 'Download LdG document', value: 'LdG' },
      { title: 'Go back to search results', value: 'back' },
      { title: 'Exit', value: 'exit' },
    ],
  })

  switch (action) {
    case 'SI':
      if (!selectedResult.documentLinks.get(RegisterDocument.SI)) {
        console.log('No SI document link found')
        displayDetails(selectedResult, {
          cookie,
          viewState,
          results,
        })
        break
      }
      requestDocument({
        cookie,
        viewState,
        documentType: RegisterDocument.SI,
        registerType: selectedResult.registerType,
        registerNumber: selectedResult.registerNumber,
        documentLink: selectedResult.documentLinks.get(RegisterDocument.SI)!,
      }).then((result) => {
        viewState = result?.viewState!
        if (!result?.content) {
          console.log('No content found')
          displayDetails(selectedResult, {
            cookie,
            viewState,
            results,
          })
          return
        }
        const { name, hq, address } = parseSI(result!.content.toString())
        console.log({ name, hq, address })
        displayDetails(selectedResult, {
          cookie,
          viewState,
          results,
        })
      })
      break
    case 'LdG':
      if (!selectedResult.documentLinks.get(RegisterDocument.DK)) {
        console.log('No DK document link found')
        displayDetails(selectedResult, {
          cookie,
          viewState,
          results,
        })
        break
      }
      requestDocument({
        cookie,
        viewState,
        documentType: RegisterDocument.DK,
        registerType: selectedResult.registerType,
        registerNumber: selectedResult.registerNumber,
        documentLink: selectedResult.documentLinks.get(RegisterDocument.DK)!,
        dkDocumentType: DkDocument.LdG,
      }).then((result) => {
        viewState = result?.viewState!
        if (!result?.content) {
          console.log('No content found')
          displayDetails(selectedResult, {
            cookie,
            viewState,
            results,
          })
          return
        }
        displayDetails(selectedResult, {
          cookie,
          viewState,
          results,
        })
      })
      break
    case 'back':
      displaySearchResults(results, {
        cookie,
        viewState,
      })
      break
    case 'exit':
      console.log('Goodbye!')
      break
  }
}

const displaySearchResults = async (
  results: SearchResult[],
  {
    cookie,
    viewState,
  }: {
    cookie: string
    viewState: string
  }
) => {
  const choices = [
    ...results.map((result, index) => ({
      title: `${result.name}, ${result.city} (${result.registerType} ${result.registerNumber})`,
      value: index,
    })),
    { title: 'Start a new search', value: 'newSearch' },
    { title: 'Exit', value: 'exit' },
  ]

  // Display search results. Let user select a result
  const { selectedResultOrAction } = await prompts({
    type: 'select',
    name: 'selectedResultOrAction',
    message: 'Select a result:',
    choices: choices,
  })

  // Check the returned value
  if (selectedResultOrAction === 'newSearch') {
    await main()
    return
  } else if (selectedResultOrAction === 'exit') {
    console.log('Goodbye!')
    return
  }

  const selectedResult = results[selectedResultOrAction]

  // filter out documentLinks
  const { documentLinks, ...rest } = selectedResult
  // Display more details for the selected search result
  console.dir(rest, { depth: null })

  // Provide more options to the user
  displayDetails(selectedResult, {
    cookie,
    viewState,
    results,
  })
}

async function main() {
  const { searchQuery } = await prompts(
    {
      type: 'text',
      name: 'searchQuery',
      message: 'Enter your search query:',
    },
    {
      onCancel: () => {
        console.log('Goodbye!')
        process.exit(0) // exit the process immediately
      },
    }
  )

  const { results, cookie, viewState } = await search(searchQuery)

  displaySearchResults(results, {
    cookie,
    viewState,
  })
}

// Kick off the process
main()
