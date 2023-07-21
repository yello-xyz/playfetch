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
  timestamp: string
  favorited: boolean
}

export type InputValues = { [name: string]: string[] }

export type ActiveProject = Project & {
  endpoints: ResolvedEndpoint[]
  inputs: InputValues
  projectURLPath: string
  availableFlavors: string[]
  prompts: Prompt[]
  chains: Chain[]
  users: User[]
}

export type Prompt = {
  id: number
  name: string
  lastVersionID: number
  projectID: number
  timestamp: string
}

export type ActivePrompt = Prompt & {
  projectID: number
  endpoints: ResolvedPromptEndpoint[]
  versions: Version[]
  users: User[]
  inputs: InputValues
  projectURLPath: string
  availableLabels: string[]
  availableFlavors: string[]
}

export type Chain = {
  id: number
  name: string
  items: ChainItem[]
  projectID: number
  timestamp: string
}

export type ActiveChain = Chain & {
  projectID: number
  endpoints: ResolvedPromptEndpoint[]
  users: User[]
  inputs: InputValues
  prompts: Prompt[]
  projectURLPath: string
  availableFlavors: string[]
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

export type AvailableProvider = {
  provider: ModelProvider
  cost: number
  truncatedAPIKey?: string
}

export type Version = {
  id: number
  promptID: number
  userID: number
  previousID?: number
  timestamp: string
  prompt: string
  config: PromptConfig
  labels: string[]
  runs: Run[]
  comments: Comment[]
}

export type PromptInputs = { [name: string]: string }

export type PartialRun = {
  id: number
  output: string
  timestamp?: string
  cost?: number
  failed?: boolean
}

export type Run = PartialRun & {
  timestamp: string
  cost: number
  inputs: PromptInputs
}

export type RunConfig = {
  versionID: number
  output?: string
  includeContext?: boolean
}

export type CodeConfig = {
  code: string
  output?: string
}

export type ChainItem = (RunConfig & { promptID: number }) | CodeConfig

export type Endpoint = {
  id: number
  enabled: boolean
  userID: number
  parentID: number
  versionID?: number
  timestamp: string
  urlPath: string
  projectURLPath: string
  flavor: string
  useCache: boolean
  useStreaming: boolean
}

export type ResolvedEndpoint = Endpoint & {
  url: string
  apiKeyDev: string
  usage: Usage
}

export type ResolvedPromptEndpoint = ResolvedEndpoint & {
  versionID: number
}

export type Usage = {
  endpointID: number
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
  promptID: number
  versionID: number
  text: string
  timestamp: string
  action?: CommentAction
  quote?: string
  runID?: number
  startIndex?: number
}
