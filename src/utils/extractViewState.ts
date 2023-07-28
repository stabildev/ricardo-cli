export const extractViewState = (document: Document): string => {
  const inputElement: HTMLInputElement | null = document.querySelector(
    'input[name="javax.faces.ViewState"]'
  )
  const value = inputElement?.value

  if (!value) {
    throw new Error('Failed to extract view state')
  }
  return value
}
