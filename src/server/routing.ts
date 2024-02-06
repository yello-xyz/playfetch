const buildURLForRoute = (route: string) => `${process.env.NEXTAUTH_URL}${route}`

export default buildURLForRoute
