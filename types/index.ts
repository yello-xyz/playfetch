export type User = {
  id: number
  email: string
  fullName: string
  imageURL: string
  isAdmin: boolean
}

export type Project = {
  id: number
  name: string
}

export type InputValues = { [name: string]: string[] }

export type ActiveProject = Project & {
  endpoints: ResolvedEndpoint[]
  inputs: InputValues
  projectURLPath: string
  availableFlavors: string[]
  prompts: Prompt[]
  users: User[]
}

export type Prompt = {
  id: number
  name: string
  prompt: string
  projectID: number
  timestamp: string
  favorited: boolean
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

export type ModelProvider = 'openai' | 'anthropic' | 'google'
export type OpenAILanguageModel = 'gpt-3.5-turbo' | 'gpt-4'
export type LanguageModel = OpenAILanguageModel | 'claude-v1' | 'palm-v2'

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

export type Run = {
  id: number
  timestamp: string
  output: string
  inputs: PromptInputs
  cost: number
}

export type RunConfig = {
  promptID: number
  versionID: number
  prompt: string
  config: PromptConfig
  output?: string
}

export type Endpoint = {
  id: number
  userID: number
  promptID: number
  chain: Chain
  timestamp: string
  urlPath: string
  projectURLPath: string
  flavor: string
  useCache: boolean
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
  cacheHits: number
  attempts: number
  failures: number
}

export type Chain = {
  promptID: number
  versionID: number
  output?: string
}[]

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
