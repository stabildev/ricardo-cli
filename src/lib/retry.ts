const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

function withRetry<T>(fetchFn: () => Promise<T>): () => Promise<T> {
  let retries = 0

  return async () => {
    while (retries < MAX_RETRIES) {
      try {
        const result = await fetchFn()
        return result
      } catch (error: any) {
        console.error(`Fetch failed: ${error.message}`)
        retries++
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }

    throw new Error(`Fetch failed after ${MAX_RETRIES} retries`)
  }
}
