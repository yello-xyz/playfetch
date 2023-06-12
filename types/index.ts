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
  prompts: Prompt[]
}

export type Prompt = {
  id: number
  name: string
  endpoint?: Endpoint
}

export type Version = {
  id: number
  previousID?: number
  timestamp: string
  prompt: string
  title: string
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
  inputs: { [variable: string]: string }
}

export type Endpoint = {
  id: number
  timestamp: string
  urlPath: string
  projectURLPath: string
  prompt: string
  config: RunConfig
}
