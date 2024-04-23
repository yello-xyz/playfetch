export const getAPIBaseURL = () => process.env.API_URL || process.env.NEXTAUTH_URL

const buildURLForRoute = (route: string) => `${process.env.NEXTAUTH_URL}${route}`

export default buildURLForRoute
