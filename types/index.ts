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
  isUserProject: boolean
}

export type InputValues = { [name: string]: string[] }

export type ActiveProject = Project & {
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
  endpoints: ResolvedEndpoint[]
  versions: Version[]
  users: User[]
  inputs: InputValues
  projectURLPath: string
  availableLabels: string[]
  availableFlavors: string[]
}

export type PromptConfig = {
  provider: 'openai' | 'anthropic' | 'google'
  temperature: number
  maxTokens: number
}

export type Version = {
  id: number
  userID: number
  previousID?: number
  timestamp: string
  prompt: string
  config: PromptConfig
  labels: string[]
  runs: Run[]
}

export type PromptInputs = { [name: string]: string }

export type Run = {
  id: number
  timestamp: string
  output: string
  inputs: PromptInputs
  cost: number
}

export type Endpoint = {
  id: number
  promptID: number
  versionID: number
  timestamp: string
  urlPath: string
  projectURLPath: string
  flavor: string
  prompt: string
  config: PromptConfig
  useCache: boolean
}

export type ResolvedEndpoint = Endpoint & {
  url: string
  apiKeyDev: string
  usage: Usage
}

export type Usage = {
  endpointID: number
  requests: number
  cost: number
  cacheHits: number
  attempts: number
  failures: number
}
