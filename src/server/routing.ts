export const getAPIBaseURLForProject = (projectID: number) =>
  `${process.env.API_URL || process.env.NEXTAUTH_URL}/${projectID}`

const buildURLForRoute = (route: string) => `${process.env.NEXTAUTH_URL}${route}`

export default buildURLForRoute
