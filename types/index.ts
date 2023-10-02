export type User = {
  id: number
  email: string
  fullName: string
  imageURL: string
  isAdmin: boolean
}

export type Workspace = {
  id: number
  name: string
}

export type ActiveWorkspace = Workspace & {
  projects: Project[]
  users: User[]
}

export type Project = {
  id: number
  name: string
  workspaceID: number
  timestamp: number
  favorited: boolean
}

export type InputValues = { [name: string]: string[] }

export type ActiveProject = Project & {
  endpoints: ResolvedEndpoint[]
  availableFlavors: string[]
  prompts: Prompt[]
  chains: Chain[]
  users: User[]
  availableLabels: string[]
}

export type Prompt = {
  id: number
  name: string
  projectID: number
  timestamp: number
}

export type ActivePrompt = Prompt & {
  versions: PromptVersion[]
  inputValues: InputValues
  users: User[]
  availableLabels: string[]
}

export type Chain = {
  id: number
  name: string
  referencedItemIDs: number[]
  projectID: number
  timestamp: number
}

export type ActiveChain = Chain & {
  versions: ChainVersion[]
  inputValues: InputValues
  users: User[]
  availableLabels: string[]
}

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'cohere'

export type OpenAILanguageModel = 'gpt-3.5-turbo' | 'gpt-4'
export type AnthropicLanguageModel = 'claude-instant-1' | 'claude-2'
export type GoogleLanguageModel = 'text-bison@001'
export type CohereLanguageModel = 'command'

export type LanguageModel = OpenAILanguageModel | AnthropicLanguageModel | GoogleLanguageModel | CohereLanguageModel

export type PromptConfig = {
  provider: ModelProvider
  model: LanguageModel
  temperature: number
  maxTokens: number
}

export type FineTunedModel = {
  id: string
  provider: ModelProvider
}

export type CustomModel = {
  id: string
  name: string
  description: string
  enabled: boolean
}

export type AvailableProvider = {
  provider: ModelProvider
  cost: number
  customModels: CustomModel[]
}

type Version = {
  id: number
  parentID: number
  userID: number
  previousID?: number
  timestamp: number
  prompts?: Prompts
  config?: PromptConfig
  items?: ChainItemWithInputs[]
  labels: string[]
  didRun: boolean
  runs: Run[]
  comments: Comment[]
}

export type Prompts = {
  main: string
  system?: string
  functions?: string
}

export type RawPromptVersion = Version & { prompts: Prompts; config: PromptConfig }
export type RawChainVersion = Version & { items: ChainItemWithInputs[] }

export type PromptVersion = RawPromptVersion & { usedInChain: string | null; usedAsEndpoint: boolean }
export type ChainVersion = RawChainVersion & { usedAsEndpoint: boolean }
export const IsPromptVersion = (version: PromptVersion | ChainVersion): version is PromptVersion =>
  'prompts' in version && version.prompts !== undefined && version.prompts !== null

export type PromptInputs = { [name: string]: string }

type CommonRun = {
  id: number
  output: string
  timestamp?: number
  cost?: number
  duration?: number
  failed?: boolean
}

export type PartialRun = CommonRun & {
  index?: number
  isLast?: boolean
}

export type Run = CommonRun & {
  timestamp: number
  cost: number
  duration: number
  inputs: PromptInputs
  labels: string[]
}

type PendingVersionRunConfig = {
  versionID?: number
  output?: string
  includeContext?: boolean
}

export type RunConfig = PendingVersionRunConfig & { versionID: number }

export type CodeConfig = {
  code: string
  name?: string
  description?: string
  output?: string
}

export type TestConfig = {
  mode: 'custom' | 'first' | 'last' | 'random' | 'all'
  rowIndices: number[]
}

export type CodeChainItem = CodeConfig & { inputs?: string[] }
export type PromptChainItem = PendingVersionRunConfig & {
  promptID: number
  inputs?: string[]
  dynamicInputs?: string[]
}
export type ChainItem = CodeChainItem | PromptChainItem

export type ChainItemWithInputs = (CodeChainItem | (PromptChainItem & { dynamicInputs: string[] })) & {
  inputs: string[]
}

export type Endpoint = {
  id: number
  enabled: boolean
  userID: number
  projectID: number
  parentID: number
  versionID: number
  timestamp: number
  urlPath: string
  flavor: string
  useCache: boolean
  useStreaming: boolean
}

export type ResolvedEndpoint = Endpoint & {
  url: string
  apiKeyDev: string
  usage: Usage
}

export const ItemsInProject = (project: ActiveProject) => [...project.prompts, ...project.chains]
export const FindItemInProject = (itemID: number | undefined, project: ActiveProject) =>
  ItemsInProject(project).find(item => item.id === itemID)!
export const ProjectItemIsChain = (item: Chain | Prompt | undefined): item is Chain =>
  !!item && 'referencedItemIDs' in item

export type Usage = {
  requests: number
  cost: number
  duration: number
  cacheHits: number
  attempts: number
  failures: number
}

export type CommentAction = 'addLabel' | 'removeLabel'

export type Comment = {
  userID: number
  versionID: number
  text: string
  timestamp: number
  action?: CommentAction
  quote?: string
  runID?: number
  itemIndex?: number
  startIndex?: number
}

export type LogEntry = {
  timestamp: number
  endpointID: number
  urlPath: string
  flavor: string
  parentID: number
  versionID: number
  cost: number
  duration: number
  inputs: PromptInputs
  output: object
  error?: string
  attempts: number
  cacheHit: boolean
  continuationID: number
}

export type Analytics = {
  recentLogEntries: LogEntry[]
  recentUsage: Usage[]
  aggregatePreviousUsage: Usage
}
