import prompts from 'prompts'
import { search } from './lib/search'
import { download } from './lib/download'
import {
  DkDocumentTypes,
  RegisterDocumentType,
  SearchResult,
} from './lib/types'
import { saveInDocuments } from './lib/save'
import { parseSI } from './lib/parse-utils'

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
      download({
        cookie,
        viewState,
        documentLink: selectedResult.documentLinks.get(
          RegisterDocumentType.SI
        )!,
      }).then((result) => {
        viewState = result?.viewState!
        saveInDocuments(
          result!.content,
          `SI_${selectedResult.name}.${result!.fileExtension}`
        )
        const { name, hq, address } = parseSI(result!.content)
        console.log({ name, hq, address })
        displayDetails(selectedResult, {
          cookie,
          viewState,
          results,
        })
      })
      break
    case 'LdG':
      download({
        cookie,
        viewState,
        documentLink: selectedResult.documentLinks.get(
          RegisterDocumentType.DK
        )!,
        dkDocumentType: DkDocumentTypes.LdG,
      }).then((result) => {
        viewState = result?.viewState!
        saveInDocuments(
          result!.content,
          `LdG_${selectedResult.name}.${result!.fileExtension}`
        )
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

  // Display more details for the selected search result
  console.dir(selectedResult, { depth: null })

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
