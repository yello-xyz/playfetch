import {
  AvailableModelProvider,
  AvailableProvider,
  CustomLanguageModel,
  CustomModel,
  DefaultLanguageModel,
  EmbeddingModel,
  LanguageModel,
  ModelProvider,
  Prompts,
  QueryProvider,
  SourceControlProvider,
} from '@/types'
import openaiIcon from '@/public/openai.svg'
import anthropicIcon from '@/public/anthropic.svg'
import googleIcon from '@/public/google.svg'
import cohereIcon from '@/public/cohere.svg'
import pineconeIcon from '@/public/pinecone.svg'
import githubIcon from '@/public/github.svg'

export const ModelProviders: ModelProvider[] = ['anthropic', 'cohere', 'google', 'openai']
export const QueryProviders: QueryProvider[] = ['pinecone']
export const SourceControlProviders: SourceControlProvider[] = ['github']

export const EmbeddingModels: EmbeddingModel[] = ['text-embedding-ada-002']
export const PublicLanguageModels: DefaultLanguageModel[] = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'claude-instant-1',
  'claude-2',
  'text-bison',
  'chat-bison',
  'gemini-pro',
  'command',
]
export const GatedLanguageModels: DefaultLanguageModel[] = [] // used to contain 'gpt-4-32k'

export const IconForProvider = (provider: ModelProvider | QueryProvider | SourceControlProvider) => {
  switch (provider) {
    case 'openai':
      return openaiIcon
    case 'anthropic':
      return anthropicIcon
    case 'google':
      return googleIcon
    case 'cohere':
      return cohereIcon
    case 'pinecone':
      return pineconeIcon
    case 'github':
      return githubIcon
  }
}

export const LabelForProvider = (provider: ModelProvider | QueryProvider | SourceControlProvider) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    case 'google':
      return 'Google'
    case 'cohere':
      return 'Cohere'
    case 'pinecone':
      return 'Pinecone'
    case 'github':
      return 'GitHub'
  }
}

export const SupportedPromptKeysForModel = (model: LanguageModel): (keyof Prompts)[] => [
  ...(SupportsSystemPrompt(model) ? ['system' as keyof Prompts] : []),
  'main',
  ...(SupportsFunctionsPrompt(model) ? ['functions' as keyof Prompts] : []),
]

export const isCustomModel = (model: LanguageModel | EmbeddingModel): model is CustomLanguageModel => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'text-embedding-ada-002':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
      return false
    default:
      return true
  }
}

// TODO generalise when we extend fine-tuning support beyond gpt-3.5-turbo
const baseModelForModel = (model: LanguageModel): DefaultLanguageModel =>
  isCustomModel(model) ? 'gpt-3.5-turbo' : model

const customModelFromProviders = (model: LanguageModel, providers: AvailableModelProvider[]): CustomModel | null => {
  return providers.flatMap(provider => provider.customModels).find(m => m.id === model) ?? null
}

export const IsProviderAvailable = (
  provider: ModelProvider | QueryProvider | SourceControlProvider,
  providers: AvailableProvider[]
): boolean => !!providers.find(p => p.provider === provider)

export const IsModelDisabled = (model: LanguageModel, providers: AvailableModelProvider[]): boolean => {
  const customModel = customModelFromProviders(model, providers)
  return !!customModel && !customModel.enabled
}

export const IsModelAvailable = (
  model: LanguageModel | EmbeddingModel,
  providers: AvailableModelProvider[]
): boolean =>
  isCustomModel(model)
    ? customModelFromProviders(model, providers)?.enabled ?? false
    : IsProviderAvailable(ProviderForModel(model), providers)

export const SupportsSeed = (model: LanguageModel): boolean => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
      return false
    default:
      return SupportsSeed(baseModelForModel(model))
  }
}

export const SupportsJsonMode = (model: LanguageModel): boolean => {
  switch (model) {
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4-turbo':
      return true
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
      return false
    default:
      return SupportsJsonMode(baseModelForModel(model))
  }
}

export const SupportsSystemPrompt = (model: LanguageModel): boolean => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'chat-bison':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison':
    case 'gemini-pro':
    case 'command':
      return false
    default:
      return SupportsSystemPrompt(baseModelForModel(model))
  }
}

export const SupportsFunctionsPrompt = (model: LanguageModel): boolean => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
      return false
    default:
      return SupportsFunctionsPrompt(baseModelForModel(model))
  }
}

export const IsMainPromptKey = (promptKey: keyof Prompts) => {
  switch (promptKey) {
    case 'main':
      return true
    case 'system':
    case 'functions':
      return false
  }
}

export const LabelForPromptKey = (promptKey: keyof Prompts) => {
  switch (promptKey) {
    case 'main':
      return 'Prompt'
    case 'system':
      return 'System'
    case 'functions':
      return 'Functions'
  }
}

export const PlaceholderForPromptKey = (promptKey: keyof Prompts) => {
  switch (promptKey) {
    case 'main':
      return 'Enter prompt here. Use {{variable}} to insert dynamic values.'
    case 'system':
      return 'Enter system prompt here. This is optional and will be ignored by models that do not support it.'
    case 'functions':
      return 'Enter functions as a JSON array. This will be ignored by models that do not support it.'
  }
}

export const PromptKeyNeedsPreformatted = (promptKey: keyof Prompts) => {
  switch (promptKey) {
    case 'main':
    case 'system':
      return false
    case 'functions':
      return true
  }
}

export const ProviderForModel = (model: LanguageModel | EmbeddingModel): ModelProvider => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'text-embedding-ada-002':
      return 'openai'
    case 'claude-instant-1':
    case 'claude-2':
      return 'anthropic'
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
      return 'google'
    case 'command':
      return 'cohere'
    default:
      return ProviderForModel(baseModelForModel(model))
  }
}

export const LabelForModel = (model: LanguageModel, providers: AvailableModelProvider[]): string => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'GPT-3.5 Turbo'
    case 'gpt-3.5-turbo-16k':
      return 'GPT-3.5 Turbo 16k'
    case 'gpt-4':
      return 'GPT-4'
    case 'gpt-4-turbo':
      return 'GPT-4 Turbo'
    case 'claude-instant-1':
      return 'Claude Instant'
    case 'claude-2':
      return 'Claude v2'
    case 'text-bison':
      return 'PaLM 2 for Text'
    case 'chat-bison':
      return 'PaLM 2 for Chat'
    case 'gemini-pro':
      return 'Gemini Pro'
    case 'command':
      return 'Command'
    default:
      return customModelFromProviders(model, providers)?.name ?? '(unavailable)'
  }
}

export const FullLabelForModel = (model: LanguageModel, providers: AvailableModelProvider[]) =>
  `${LabelForProvider(ProviderForModel(model))} - ${LabelForModel(model, providers)}`

export const WebsiteLinkForModel = (model: LanguageModel): string => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
      return 'https://platform.openai.com/docs/models/gpt-3-5'
    case 'gpt-4':
    case 'gpt-4-turbo':
      return 'https://platform.openai.com/docs/models/gpt-4'
    case 'claude-instant-1':
      return 'https://docs.anthropic.com/claude/reference/selecting-a-model'
    case 'claude-2':
      return 'https://docs.anthropic.com/claude/reference/selecting-a-model'
    case 'text-bison':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text'
    case 'chat-bison':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text-chat'
    case 'gemini-pro':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini'
    case 'command':
      return 'https://docs.cohere.com/docs/models'
    default:
      // TODO generalise when we extend fine-tuning support beyond gpt-3.5-turbo
      return 'https://platform.openai.com/docs/guides/fine-tuning'
  }
}

export const DescriptionForModel = (model: LanguageModel, providers: AvailableModelProvider[]): string => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'OpenAI’s most capable and cost effective model in the GPT-3.5 family optimized for chat purposes, but also works well for traditional completions tasks (gpt-3.5-turbo-0613).'
    case 'gpt-3.5-turbo-16k':
      return 'This is the updated version of GPT-3.5 Turbo with 4 times the context window and lower pricing (gpt-3.5-turbo-1106).'
    case 'gpt-4':
      return 'GPT-4 from OpenAI has broad general knowledge and domain expertise allowing it to follow complex instructions in natural language and solve difficult problems accurately (gpt-4-0613).'
    case 'gpt-4-turbo':
      return 'Preview of OpenAI’s most advanced model, offering a 128K context window and knowledge of world events up to April 2023 (gpt-4-1106-preview). Suitable for testing and evaluations, not recommended for production usage due to restrictive rate limits under preview.'
    case 'claude-instant-1':
      return 'A faster, cheaper yet still very capable version of Claude, which can handle a range of tasks including casual dialogue, text analysis, summarization, and document comprehension (claude-instant-1).'
    case 'claude-2':
      return 'Anthropic’s most powerful model that excels at a wide range of tasks from sophisticated dialogue and creative content generation to detailed instruction (claude-2). It is good for complex reasoning, creativity, thoughtful dialogue, coding, and detailed content creation.'
    case 'text-bison':
      return 'Google’s foundation model optimized for a variety of natural language tasks such as sentiment analysis, entity extraction, and content creation (text-bison). Fine-tuned for tasks that can be completed with one response, without the need for continuous conversation.'
    case 'chat-bison':
      return 'Google’s foundation model optimized for language understanding, language generation, and conversations (chat-bison). Fine-tuned to conduct natural multi-turn conversations, and for text tasks about code that require back-and-forth interactions.'
    case 'gemini-pro':
      return 'Preview of the latest family of generative AI models developed by Google DeepMind (gemini-pro). Suitable for testing and evaluations, not recommended for production usage due to restrictive rate limits under preview.'
    case 'command':
      return 'An instruction-following conversational model by Cohere that performs language tasks with high quality and reliability while providing longer context compared to generative models.'
    default:
      return customModelFromProviders(model, providers)?.description ?? ''
  }
}

export const MaxTokensForModel = (model: LanguageModel): number => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 4097
    case 'gpt-3.5-turbo-16k':
      return 16385
    case 'gpt-4':
      return 8192
    case 'gpt-4-turbo':
      return 128000
    case 'claude-instant-1':
      return 100000
    case 'claude-2':
      return 100000
    case 'text-bison':
    case 'chat-bison':
      // TODO should we separate max input tokens vs max output tokens? (8192 vs 1024)
      return 8192
    case 'gemini-pro':
      return 16384
    case 'command':
      return 4096
    default:
      return MaxTokensForModel(baseModelForModel(model))
  }
}

export const InputPriceForModel = (model: LanguageModel | EmbeddingModel): number => {
  switch (model) {
    case 'text-embedding-ada-002':
      return 0.1
    case 'gpt-3.5-turbo':
      return 1.5
    case 'gpt-3.5-turbo-16k':
      return 1
    case 'gpt-4':
      return 30
    case 'gpt-4-turbo':
      return 10
    case 'claude-instant-1':
      return 1.63
    case 'claude-2':
      return 11.02
    case 'command':
      return 15
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
      return 0
    default:
      // TODO generalise when we extend fine-tuning support beyond gpt-3.5-turbo
      return 3
  }
}

export const OutputPriceForModel = (model: LanguageModel | EmbeddingModel): number => {
  switch (model) {
    case 'text-embedding-ada-002':
      return 0.1
    case 'gpt-3.5-turbo':
      return 2
    case 'gpt-3.5-turbo-16k':
      return 2
    case 'gpt-4':
      return 60
    case 'gpt-4-turbo':
      return 30
    case 'claude-instant-1':
      return 5.51
    case 'claude-2':
      return 32.68
    case 'command':
      return 15
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
      return 0
    default:
      // TODO generalise when we extend fine-tuning support beyond gpt-3.5-turbo
      return 6
  }
}

export const IsModelFreeToUse = (model: LanguageModel | EmbeddingModel): boolean =>
  InputPriceForModel(model) === 0 && OutputPriceForModel(model) === 0
