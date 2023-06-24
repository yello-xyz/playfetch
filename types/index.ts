export type User = {
  id: number
  email: string
  fullName: string
  avatarColor: string
  isAdmin: boolean
}

export type Project = {
  id: number
  name: string
  urlPath: string
  labels: string[]
  timestamp: string
}

export type ActiveProject =
  | (Project & {
      prompts: Prompt[]
      users: User[]
    })
  | { id: null; prompts: Prompt[] }

export type Prompt = {
  id: number
  name: string
  prompt: string
  projectID: number | null
  timestamp: string
  favorited: boolean
}

export type ActivePrompt = Prompt & {
  endpoint?: Endpoint
  versions: Version[]
}

export type PromptConfig = {
  provider: 'openai' | 'anthropic' | 'google'
  temperature: number
  maxTokens: number
}

export type Version = {
  id: number
  previousID?: number
  timestamp: string
  prompt: string
  config: PromptConfig
  labels: string[]
  runs: Run[]
}

export type PromptInputs = { [variable: string]: string }

export type Run = {
  id: number
  timestamp: string
  output: string
  inputs: PromptInputs
  cost: number
}

export type Endpoint = {
  id: number
  timestamp: string
  urlPath: string
  projectURLPath: string
  prompt: string
  config: PromptConfig
  useCache: boolean
  token: string
}
