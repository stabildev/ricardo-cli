export const extractCookie = (response: Response): string | undefined => {
  const cookies = response.headers.get('set-cookie')

  const sessionCookie = cookies
    ?.split(';')
    .find((cookie) => cookie.includes('JSESSIONID='))

  return sessionCookie
}
