export type User = {
  id: number
  email: string
  isAdmin: boolean
}

export type Project = {
  id: number
  name: string
  prompts: Prompt[]
}

export type Prompt = {
  id: number
  prompt: string
}

export type Version = {
  id: number
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
}
