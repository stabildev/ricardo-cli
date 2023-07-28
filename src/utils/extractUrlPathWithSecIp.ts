export const extractUrlPathWithSecIp = (document: Document): string => {
  const formElement: HTMLFormElement | null =
    document.querySelector('form#ergebnissForm')
  const action = formElement?.action

  if (!action) {
    throw new Error('Failed to extract url path with sec ip')
  }
  return action
}
