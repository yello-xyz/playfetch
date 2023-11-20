export const SortAndFilterProviderData =
  (scopeIDs: number[]) =>
  (providerData: any[]): any[] =>
    providerData
      .sort((a, b) => scopeIDs.indexOf(a.scopeID) - scopeIDs.indexOf(b.scopeID))
      .reduce(
        (filtered, providerData) =>
          filtered.some((p: any) => p.provider === providerData.provider) ? filtered : [...filtered, providerData],

        []
      )
