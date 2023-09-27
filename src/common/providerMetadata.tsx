import { LanguageModel, ModelProvider, Prompts } from '@/types'
import openaiIcon from '@/public/openai.svg'
import anthropicIcon from '@/public/anthropic.svg'
import googleIcon from '@/public/google.svg'
import cohereIcon from '@/public/cohere.svg'

export const AllProviders: ModelProvider[] = ['openai', 'anthropic', 'google', 'cohere']

export const AllModels: LanguageModel[] = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-instant-1',
  'claude-2',
  'text-bison@001',
  'command',
]

export const IconForProvider = (provider: ModelProvider) => {
  switch (provider) {
    case 'openai':
      return openaiIcon
    case 'anthropic':
      return anthropicIcon
    case 'google':
      return googleIcon
    case 'cohere':
      return cohereIcon
  }
}

export const LabelForProvider = (provider: ModelProvider) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    case 'google':
      return 'Google'
    case 'cohere':
      return 'Cohere'
  }
}

export const SupportedPromptKeysForModel = (model: LanguageModel): (keyof Prompts)[] => [
  ...(SupportsSystemPrompt(model) ? ['system' as keyof Prompts] : []),
  'main',
  ...(SupportsFunctionsPrompt(model) ? ['functions' as keyof Prompts] : []),
]

export const SupportsSystemPrompt = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return false
  }
}

export const SupportsFunctionsPrompt = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return false
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

export const ProviderForModel = (model: LanguageModel): ModelProvider => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
      return 'openai'
    case 'claude-instant-1':
    case 'claude-2':
      return 'anthropic'
    case 'text-bison@001':
      return 'google'
    case 'command':
      return 'cohere'
  }
}

const labelForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'GPT-3.5 Turbo'
    case 'gpt-4':
      return 'GPT-4'
    case 'claude-instant-1':
      return 'Claude Instant'
    case 'claude-2':
      return 'Claude v2'
    case 'text-bison@001':
      return 'PaLM v2'
    case 'command':
      return 'Command'
  }
}

const shortLabelForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'GPT3.5'
    case 'gpt-4':
      return 'GPT4'
    case 'claude-instant-1':
    case 'claude-2':
      return 'Claude'
    case 'text-bison@001':
      return 'PaLM'
    case 'command':
      return 'Command'
  }
}

export const LabelForModel = (model: LanguageModel, includeProvider = true) =>
  includeProvider
    ? `${LabelForProvider(ProviderForModel(model))} ${shortLabelForModel(model)}`
    : shortLabelForModel(model)

export const FullLabelForModel = (model: LanguageModel, includeProvider = true) =>
  includeProvider ? `${LabelForProvider(ProviderForModel(model))} - ${labelForModel(model)}` : labelForModel(model)

export const WebsiteLinkForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'https://platform.openai.com/docs/models/gpt-3-5'
    case 'gpt-4':
      return 'https://platform.openai.com/docs/models/gpt-4'
    case 'claude-instant-1':
      return 'https://docs.anthropic.com/claude/reference/selecting-a-model'
    case 'claude-2':
      return 'https://docs.anthropic.com/claude/reference/selecting-a-model'
    case 'text-bison@001':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text'
    case 'command':
      return 'https://docs.cohere.com/docs/models'
  }
}

export const DescriptionForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 'OpenAI’s most capable and cost effective model in the GPT-3.5 family optimized for chat purposes, but also works well for traditional completions tasks.'
    case 'gpt-4':
      return 'GPT-4 from OpenAI has broad general knowledge and domain expertise allowing it to follow complex instructions in natural language and solve difficult problems accurately.'
    case 'claude-instant-1':
      return 'A faster, cheaper yet still very capable version of Claude, which can handle a range of tasks including casual dialogue, text analysis, summarization, and document comprehension.'
    case 'claude-2':
      return 'Anthropic’s most powerful model that excels at a wide range of tasks from sophisticated dialogue and creative content generation to detailed instruction. It is good for complex reasoning, creativity, thoughtful dialogue, coding,and detailed content creation.'
    case 'text-bison@001':
      return 'Google’s foundation model optimized for a variety of natural language tasks such as sentiment analysis, entity extraction, and content creation.'
    case 'command':
      return 'An instruction-following conversational model by Cohere that performs language tasks with high quality and reliability while providing longer context compared to generative models.'
  }
}

export const MaxTokensForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 4097
    case 'gpt-4':
      return 8192
    case 'claude-instant-1':
      return 100000
    case 'claude-2':
      return 100000
    case 'text-bison@001':
      // TODO should we separate max input tokens vs max output tokens? (8192 vs 1024)
      return 8192
    case 'command':
      return 4096
  }
}

export const InputPriceForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 1.5
    case 'gpt-4':
      return 30
    case 'claude-instant-1':
      return 1.63
    case 'claude-2':
      return 11.02
    case 'command':
      return 15
    case 'text-bison@001':
      return 0
  }
}

export const OutputPriceForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
      return 2
    case 'gpt-4':
      return 60
    case 'claude-instant-1':
      return 5.51
    case 'claude-2':
      return 32.68
    case 'command':
      return 15
    case 'text-bison@001':
      return 0
  }
}
