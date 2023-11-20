import { SortAndFilterProviderData } from '@/src/server/providers/cascade'

const testFilterProviders = (testDescription: string, scopeIDs: number[], input: any[], expected: any[]) =>
  test(testDescription, async () => expect(SortAndFilterProviderData(scopeIDs)(input)).toStrictEqual(expected))

const provider = (provider: string, scopeID: number) => ({ provider, scopeID })

testFilterProviders('Retains empty providers', [], [], [])
testFilterProviders(
  'Retains disjoint providers',
  [1, 2],
  [provider('openai', 1), provider('anthropic', 2)],
  [provider('openai', 1), provider('anthropic', 2)]
)
testFilterProviders(
  'Filters overlapping providers',
  [1, 2],
  [provider('openai', 1), provider('openai', 2)],
  [provider('openai', 1)]
)
testFilterProviders(
  'Sorts overlapping providers',
  [2, 1],
  [provider('openai', 1), provider('openai', 2)],
  [provider('openai', 2)]
)
testFilterProviders(
  'Sorts and filters multiple overlapping providers',
  [2, 1],
  [provider('openai', 1), provider('anthropic', 2), provider('anthropic', 1), provider('openai', 2)],
  [provider('anthropic', 2), provider('openai', 2)]
)
