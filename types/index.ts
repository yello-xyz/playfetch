export type User = {
  id: number
  email: string
  fullName: string
  imageURL: string
  isAdmin: boolean
  lastLoginAt: number | null
  didCompleteOnboarding: boolean
}

type PendingAttributes = {
  invitedBy: User
  timestamp: number
}

export type PendingUser = User & PendingAttributes

export type Workspace = {
  id: number
  name: string
}

export type PendingWorkspace = Workspace & PendingAttributes

export type ActiveWorkspace = Workspace & {
  projects: Project[]
  users: User[]
  pendingUsers: PendingUser[]
}

export const IsPendingWorkspace = (workspace: ActiveWorkspace | PendingWorkspace): workspace is PendingWorkspace =>
  'invitedBy' in workspace

export type Project = {
  id: number
  name: string
  workspaceID: number
  timestamp: number
  favorited: boolean
  isOwner: boolean
  createdBy: number
}

export type PendingProject = Project & PendingAttributes

export const IsPendingProject = (project: Project | PendingProject): project is PendingProject => 'invitedBy' in project

export type InputValues = { [name: string]: string[] }

export type ActiveProject = Project & {
  endpoints: ResolvedEndpoint[]
  availableFlavors: string[]
  prompts: Prompt[]
  chains: Chain[]
  tables: Table[]
  users: User[]
  pendingUsers: PendingUser[]
  projectOwners: User[]
  projectMembers: User[]
  pendingProjectMembers: PendingUser[]
  availableLabels: string[]
  comments: Comment[]
}

export type Prompt = {
  id: number
  name: string
  projectID: number
  tableID: number | null
  sourcePath: string | null
}

export type ActivePrompt = Prompt & {
  versions: PromptVersion[]
  inputValues: InputValues
  users: User[]
  availableLabels: string[]
  canSuggestImprovements: boolean
}

export type Chain = {
  id: number
  name: string
  projectID: number
  tableID: number | null
  referencedItemIDs: number[]
}

export type ActiveChain = Chain & {
  versions: ChainVersion[]
  inputValues: InputValues
  users: User[]
  availableLabels: string[]
}

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface'

export type OpenAIEmbeddingModel = 'text-embedding-ada-002'
export type EmbeddingModel = OpenAIEmbeddingModel

export type OpenAILanguageModel = 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' | 'gpt-4' | 'gpt-4-turbo'
export type AnthropicLanguageModel = 'claude-instant-1' | 'claude-2'
export type GoogleLanguageModel = 'text-bison' | 'chat-bison' | 'gemini-pro'
export type CohereLanguageModel = 'command'
export type HuggingFaceLanguageModel = 'meta-llama/Llama-2-70b-chat-hf'

export type DefaultLanguageModel =
  | OpenAILanguageModel
  | AnthropicLanguageModel
  | GoogleLanguageModel
  | CohereLanguageModel
  | HuggingFaceLanguageModel

export type CustomLanguageModel = string

export type LanguageModel = DefaultLanguageModel | CustomLanguageModel

export type PromptConfig = {
  model: LanguageModel
  isChat: boolean
  temperature: number
  maxTokens: number
  seed?: number
  jsonMode?: boolean
}

export type CustomModel = {
  id: string
  name: string
  description: string
  enabled: boolean
}

export type AvailableModelProvider = {
  provider: ModelProvider
  customModels: CustomModel[]
  gatedModels: DefaultLanguageModel[]
}
export type AvailableQueryProvider = {
  provider: QueryProvider
  environment: string
}
export type AvailableSourceControlProvider = {
  provider: SourceControlProvider
  environment: string
  scopeID: number
}
export type AvailableIssueTrackerProvider = {
  provider: IssueTrackerProvider
  environment: string
  scopeID: number
}
export type AvailableProvider =
  | AvailableModelProvider
  | AvailableQueryProvider
  | AvailableSourceControlProvider
  | AvailableIssueTrackerProvider
export const IsModelProvider = (provider: AvailableProvider): provider is AvailableModelProvider =>
  'customModels' in provider

export type QueryProvider = 'pinecone'
export type SourceControlProvider = 'github'
export type IssueTrackerProvider = 'linear'
export type SupportedProvider = ModelProvider | QueryProvider | SourceControlProvider | IssueTrackerProvider

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
}

export type Prompts = {
  main: string
  system?: string
  functions?: string
}

export type RawPromptVersion = Version & { prompts: Prompts; config: PromptConfig }
export type RawChainVersion = Version & { items: ChainItemWithInputs[] }
export const IsRawPromptVersion = (version: RawPromptVersion | RawChainVersion): version is RawPromptVersion =>
  'prompts' in version && version.prompts !== undefined && version.prompts !== null

export type PromptVersion = RawPromptVersion & {
  comments: Comment[]
  usedInChain: string | null
  usedAsEndpoint: boolean
}
export type ChainVersion = RawChainVersion & { comments: Comment[]; usedAsEndpoint: boolean }
export const IsPromptVersion = (version: PromptVersion | ChainVersion): version is PromptVersion =>
  IsRawPromptVersion(version)

export type PromptInputs = { [name: string]: string }

export type PartialRun = {
  id: number
  index: number
  output: string
  timestamp?: number
  cost?: number
  duration?: number
  failed?: boolean
  continuationID?: number
  canContinue?: boolean
  parentRunID?: number | null
  continuations?: (PartialRun | Run)[]
  userID?: number
  onCancel?: () => void
}

export type Run = PartialRun & {
  timestamp: number
  parentRunID: number | null
  cost: number
  duration: number
  tokens: number
  inputs: PromptInputs
  labels: string[]
  rating: RunRating | null
  isPredictedRating: boolean
  reason: string | null
  userID: number
}

export const IsProperRun = (item: PartialRun | Run): item is Run => 'labels' in item

type CommonConfigAttributes = {
  output?: string
  branch: number
}

type PendingVersionRunConfig = CommonConfigAttributes & {
  versionID?: number
  includeContext?: boolean
}

export type RunConfig = PendingVersionRunConfig & { versionID: number }

export type CodeConfig = CommonConfigAttributes & {
  code: string
  name?: string
  description?: string
}

export type BranchConfig = CommonConfigAttributes & {
  code: string
  branches: string[]
  loops?: number[]
}

export type QueryConfig = CommonConfigAttributes & {
  provider: QueryProvider
  model: EmbeddingModel
  indexName: string
  query: string
  topK: number
}

export type CodeChainItem = CodeConfig & { inputs?: string[] }
export type BranchChainItem = BranchConfig & { inputs?: string[] }
export type QueryChainItem = QueryConfig & { inputs?: string[] }
export type PromptChainItem = PendingVersionRunConfig & {
  promptID: number
  inputs?: string[]
  dynamicInputs?: string[]
}
export type ChainItem = CodeChainItem | BranchChainItem | QueryChainItem | PromptChainItem

export type ChainItemWithInputs = (
  | CodeChainItem
  | BranchChainItem
  | QueryChainItem
  | (PromptChainItem & { dynamicInputs: string[] })
) & {
  inputs: string[]
}

export type TestConfig = {
  rowIndices: number[]
  autoRespond?: boolean
  maxResponses?: number
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

export const ProjectItemIsChain = (item: Chain | Prompt | Table | undefined): item is Chain =>
  !!item && 'referencedItemIDs' in item
export const ProjectItemIsPrompt = (item: Chain | Prompt | Table | undefined): item is Prompt =>
  !!item && 'sourcePath' in item
export const ProjectItemIsTable = (item: Chain | Prompt | Table | undefined) =>
  !!item && !ProjectItemIsChain(item) && !ProjectItemIsPrompt(item)

export type Usage = {
  requests: number
  cost: number
  duration: number
  cacheHits: number
  continuations: number
  attempts: number
  failures: number
}

export type RunRating = 'positive' | 'negative'
export type CommentAction = 'addLabel' | 'removeLabel' | 'thumbsUp' | 'thumbsDown'

export type Comment = {
  id: number
  userID: number
  parentID: number
  versionID: number
  text: string
  timestamp: number
  replyTo?: number
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
  continuationID?: number
}

export type CostUsage = {
  cost: number
  limit: number | null
  threshold: number | null
  modelCosts: { [model: string]: number }[]
}

export type Analytics = {
  recentLogEntries: LogEntry[]
  recentUsage: Usage[]
  aggregatePreviousUsage: Usage
}

export type ActiveUser = User & {
  lastActive: number
  startTimestamp: number
  versionCount: number
  runCount: number
  promptCount: number
  chainCount: number
  commentCount: number
  endpointCount: number
}

export type UserMetrics = {
  createdWorkspaceCount: number
  workspaceAccessCount: number
  projectAccessCount: number
  activity: { timestamp: number; versions: number; runs: number; comments: number; endpoints: number }[]
  providers: (ModelProvider | QueryProvider)[]
  sharedProjects: RecentProject[]
  pendingSharedProjects: RecentProject[]
  workspaces: Workspace[]
  pendingWorkspaces: Workspace[]
}

export type RecentProject = Project & {
  workspace: string
  creator: string
}

export type ProjectMetrics = {
  promptCount: number
  chainCount: number
  endpointCount: number
  analytics: Analytics
  users: ActiveUser[]
  pendingUsers: ActiveUser[]
}

export type WorkspaceMetrics = ActiveWorkspace & {
  projects: RecentProject[]
  users: ActiveUser[]
  pendingUsers: ActiveUser[]
}

export type OnboardingResponse = {
  useCase: {
    iteration: boolean
    testing: boolean
    collaboration: boolean
    monitoring: boolean
    deployment: boolean
    feedback: boolean
  }
  otherUseCase?: string
  role?: 'executive' | 'manager' | 'individual' | 'contractor'
  area?: 'product' | 'engineering' | 'marketing' | 'content' | 'design' | 'sales'
  otherArea?: string
}

export type Table = {
  id: number
  name: string
  projectID: number
}

export type ActiveTable = Table & { inputValues: InputValues }
