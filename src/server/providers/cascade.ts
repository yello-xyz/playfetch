const hasValidProvider = (providerData: any[], provider: string) =>
  providerData.some((p: any) => p.provider === provider && p.encryptedAPIKey !== null)

export const SortAndFilterProviderData =
  (scopeIDs: number[]) =>
  (providerData: any[]): any[] =>
    providerData
      .filter((p: any, _, ps) => p.encryptedAPIKey !== null || !hasValidProvider(ps, p.provider))
      .sort((a, b) => scopeIDs.indexOf(a.scopeID) - scopeIDs.indexOf(b.scopeID))
      .reduce((acc, next) => (hasValidProvider(acc, next.provider) ? acc : [...acc, next]), [])
