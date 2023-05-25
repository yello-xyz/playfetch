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
