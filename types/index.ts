export type User = {
  id: number
  email: string
  timestamp: string
  isAdmin: boolean
  lastLoginAt?: string
}

export type Project = {
  id: number
  name: string
  urlPath: string
  timestamp: string
}

export type Prompt = {
  id: number
  name: string
  prompt: string
  projectID: number | null
}

export type ActivePrompt = Prompt & {
  endpoint?: Endpoint
  versions: Version[]
}

export type Version = {
  id: number
  previousID?: number
  timestamp: string
  prompt: string
  tags: string
  runs: Run[]
}

export type Run = {
  id: number
  timestamp: string
  output: string
  config: RunConfig
  cost: number
}

export type RunConfig = {
  provider: 'openai' | 'anthropic' | 'google'
  temperature: number
  maxTokens: number
  useCache: boolean
  inputs: { [variable: string]: string }
}

export type Endpoint = {
  id: number
  timestamp: string
  urlPath: string
  projectURLPath: string
  prompt: string
  config: RunConfig
  token: string
}
