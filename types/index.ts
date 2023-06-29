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
  urlPath: string | null
  labels: string[] | null
}

export type ProperProject = Project & {
  urlPath: string
  labels: string[]
}

export const isProperProject = (item: Project): item is ProperProject => (item as ProperProject).urlPath !== null

export type InputValues = {
  id: number
  name: string
  values: string[]
}

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
  endpoint?: Endpoint
  versions: Version[]
  users: User[]
  inputs: InputValues[]
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
  timestamp: string
  urlPath: string
  projectURLPath: string
  prompt: string
  config: PromptConfig
  useCache: boolean
  token: string
}
