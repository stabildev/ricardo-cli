import prompts from 'prompts'
import { search } from './lib/search'
import { DkDocument, RegisterDocument, SearchResult } from './lib/types'
import { parseSI } from './lib/parse-utils'
import { requestDocument } from './lib/requestDocument'

type Context = {
  cookie: string | null
  viewState: string | null
  results: SearchResult[]
  selectedResult: SearchResult | null
}

const context: Context = {
  cookie: null,
  viewState: null,
  results: [],
  selectedResult: null,
}

async function main() {
  context.results = []
  context.selectedResult = null

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

  // Perform the search
  const { results, cookie, viewState } = await search(searchQuery)

  context.results = results
  context.cookie = cookie
  context.viewState = viewState

  displaySearchResults()
}

const displaySearchResults = async () => {
  const choices = [
    ...context.results.map((result, index) => ({
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

  context.selectedResult = context.results[selectedResultOrAction]

  displayDetails(true)
}

const displayDetails = async (print = false) => {
  if (!context.selectedResult) {
    return
  }

  if (print) {
    // filter out documentLinks
    const { documentLinks, ...rest } = context.selectedResult

    // Display more details for the selected search result
    console.dir(rest, { depth: null })
  }

  // Provide more options to the user
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
    case 'SI': {
      const SIdocumentLink = context.selectedResult.documentLinks.get(
        RegisterDocument.SI
      )
      if (!SIdocumentLink) {
        console.log('No SI document link found')
        displayDetails()
        break
      }
      const result = await requestDocument({
        cookie: context.cookie!,
        viewState: context.viewState!,
        documentType: RegisterDocument.SI,
        registerType: context.selectedResult.registerType,
        registerNumber: context.selectedResult.registerNumber,
        documentLink: SIdocumentLink,
      })
      // Update viewState
      context.viewState = result.viewState
      if (!result.file) {
        console.log('File not found')
        displayDetails()
        break
      }
      const { name, hq, address } = parseSI(result.file.content.toString())
      console.log({ name, hq, address })
      displayDetails()
      break
    }
    case 'LdG': {
      const DKDocumentLink = context.selectedResult.documentLinks.get(
        RegisterDocument.DK
      )
      if (!DKDocumentLink) {
        console.log('No DK document link found')
        displayDetails()
        break
      }
      const result = await requestDocument({
        cookie: context.cookie!,
        viewState: context.viewState!,
        documentType: RegisterDocument.DK,
        registerType: context.selectedResult.registerType,
        registerNumber: context.selectedResult.registerNumber,
        documentLink: DKDocumentLink,
        dkDocumentType: DkDocument.LdG,
      })
      // Update viewState
      context.viewState = result.viewState
      if (!result.file) {
        console.log('File not found')
        displayDetails()
        break
      }
      displayDetails()
      break
    }
    case 'back':
      context.selectedResult = null
      displaySearchResults()
      return
    case 'exit':
      console.log('Goodbye!')
      return
  }
}

// Kick off the process
main()
