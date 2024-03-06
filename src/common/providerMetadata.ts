import {
  AvailableModelProvider,
  AvailableProvider,
  CustomLanguageModel,
  CustomModel,
  DefaultLanguageModel,
  EmbeddingModel,
  LanguageModel,
  ModelProvider,
  PromptConfig,
  QueryProvider,
  SourceControlProvider,
  IssueTrackerProvider,
  SupportedProvider,
} from '@/types'
import openaiIcon from '@/public/openai.svg'
import anthropicIcon from '@/public/anthropic.svg'
import googleIcon from '@/public/google.svg'
import cohereIcon from '@/public/cohere.svg'
import mistralIcon from '@/public/mistral.svg'
import huggingFaceIcon from '@/public/huggingface.svg'
import pineconeIcon from '@/public/pinecone.svg'
import githubIcon from '@/public/github.svg'
import linearIcon from '@/public/linear.svg'

export const ModelProviders: ModelProvider[] = ['anthropic', 'cohere', 'google', 'huggingface', 'mistral', 'openai']
export const QueryProviders: QueryProvider[] = ['pinecone']
export const SourceControlProviders: SourceControlProvider[] = ['github']
export const IssueTrackerProviders: IssueTrackerProvider[] = ['linear']

export const EmbeddingModels: EmbeddingModel[] = [
  'text-embedding-ada-002',
  'text-embedding-3-small',
  'text-embedding-3-large',
  'mistral-embed',
]
export const PublicLanguageModels: DefaultLanguageModel[] = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'claude-instant-1',
  'claude-2',
  'claude-3-sonnet',
  'claude-3-opus',
  'text-bison',
  'chat-bison',
  'gemini-pro',
  'command',
  'mistral-small-latest',
  'mistral-large-latest',
  'meta-llama/Llama-2-70b-chat-hf',
]
export const GatedLanguageModels: DefaultLanguageModel[] = [] // used to contain 'gpt-4-32k'

export const IconForProvider = (provider: SupportedProvider) => {
  switch (provider) {
    case 'openai':
      return openaiIcon
    case 'anthropic':
      return anthropicIcon
    case 'google':
      return googleIcon
    case 'cohere':
      return cohereIcon
    case 'mistral':
      return mistralIcon
    case 'huggingface':
      return huggingFaceIcon
    case 'pinecone':
      return pineconeIcon
    case 'github':
      return githubIcon
    case 'linear':
      return linearIcon
  }
}

export const LabelForProvider = (provider: SupportedProvider) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    case 'google':
      return 'Google'
    case 'cohere':
      return 'Cohere'
    case 'mistral':
      return 'Mistral AI'
    case 'huggingface':
      return 'Hugging Face'
    case 'pinecone':
      return 'Pinecone'
    case 'github':
      return 'GitHub'
    case 'linear':
      return 'Linear'
  }
}

export const isCustomModel = (model: LanguageModel | EmbeddingModel): model is CustomLanguageModel => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'text-embedding-ada-002':
    case 'text-embedding-3-small':
    case 'text-embedding-3-large':
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
    case 'mistral-small-latest':
    case 'mistral-large-latest':
    case 'mistral-embed':
    case 'meta-llama/Llama-2-70b-chat-hf':
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

export const IsProviderAvailable = (provider: SupportedProvider, providers: AvailableProvider[]): boolean =>
  !!providers.find(p => p.provider === provider)

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
    case 'mistral-small-latest':
    case 'mistral-large-latest':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
    case 'meta-llama/Llama-2-70b-chat-hf':
      return false
    default:
      return SupportsSeed(baseModelForModel(model))
  }
}

export const SupportsJsonMode = (model: LanguageModel): boolean => {
  switch (model) {
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4-turbo':
    case 'mistral-small-latest':
    case 'mistral-large-latest':
      return true
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
    case 'meta-llama/Llama-2-70b-chat-hf':
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
    case 'mistral-small-latest':
    case 'mistral-large-latest':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'text-bison':
    case 'gemini-pro':
    case 'command':
    case 'meta-llama/Llama-2-70b-chat-hf':
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
    case 'mistral-small-latest':
    case 'mistral-large-latest':
      return true
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'command':
    case 'meta-llama/Llama-2-70b-chat-hf':
      return false
    default:
      return SupportsFunctionsPrompt(baseModelForModel(model))
  }
}

export const ProviderForModel = (model: LanguageModel | EmbeddingModel): ModelProvider => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'text-embedding-ada-002':
    case 'text-embedding-3-small':
    case 'text-embedding-3-large':
      return 'openai'
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
      return 'anthropic'
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
      return 'google'
    case 'command':
      return 'cohere'
    case 'mistral-small-latest':
    case 'mistral-large-latest':
    case 'mistral-embed':
      return 'mistral'
    case 'meta-llama/Llama-2-70b-chat-hf':
      return 'huggingface'
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
      return 'Claude 2'
    case 'claude-3-sonnet':
      return 'Claude 3 Sonnet'
    case 'claude-3-opus':
      return 'Claude 3 Opus'
    case 'text-bison':
      return 'PaLM 2 for Text'
    case 'chat-bison':
      return 'PaLM 2 for Chat'
    case 'gemini-pro':
      return 'Gemini Pro'
    case 'command':
      return 'Command'
    case 'mistral-small-latest':
      return 'Mistral Small'
    case 'mistral-large-latest':
      return 'Mistral Large'
    case 'meta-llama/Llama-2-70b-chat-hf':
      return 'Meta Llama 2'
    case 'text-embedding-ada-002':
    case 'text-embedding-3-small':
    case 'text-embedding-3-large':
    case 'mistral-embed':
      return model
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
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
      return 'https://docs.anthropic.com/claude/docs/models-overview'
    case 'text-bison':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text'
    case 'chat-bison':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text-chat'
    case 'gemini-pro':
      return 'https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini'
    case 'command':
      return 'https://docs.cohere.com/docs/models'
    case 'mistral-small-latest':
      return 'https://docs.mistral.ai/guides/model-selection/#mistral-small-simple-tasks-that-one-can-do-in-bulk'
    case 'mistral-large-latest':
      return 'https://docs.mistral.ai/guides/model-selection/#mistral-large-complex-tasks-that-require-large-reasoning-capabilities-or-are-highly-specialized'
    case 'meta-llama/Llama-2-70b-chat-hf':
      return 'https://huggingface.co/meta-llama/Llama-2-70b-chat-hf'
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
      return 'This is the updated version of GPT-3.5 Turbo with 4 times the context window and lower pricing (gpt-3.5-turbo-0125).'
    case 'gpt-4':
      return 'GPT-4 from OpenAI has broad general knowledge and domain expertise allowing it to follow complex instructions in natural language and solve difficult problems accurately (gpt-4-0613).'
    case 'gpt-4-turbo':
      return 'Preview of OpenAI’s most advanced model, offering a 128K context window and knowledge of world events up to April 2023 (gpt-4-0125-preview). Suitable for testing and evaluations, not recommended for production usage due to restrictive rate limits under preview.'
    case 'claude-instant-1':
      return 'A faster, cheaper version of Claude, which can handle a range of tasks including casual dialogue, text analysis, summarization, and document comprehension (claude-instant-1.2).'
    case 'claude-2':
      return 'The predecessor to Claude 3, offering strong performance across a variety of tasks (claude-2.1).'
    case 'claude-3-sonnet':
      return 'Anthropic’s most balanced model between intelligence and speed, a great choice for enterprise workloads and scaled AI deployments (claude-3-sonnet-20240229).'
    case 'claude-3-opus':
      return 'Anthropic’s most powerful model, delivering state-of-the-art performance on highly complex tasks and demonstrating fluency and human-like understanding (claude-3-opus-20240229).'
    case 'text-bison':
      return 'Google’s foundation model optimized for a variety of natural language tasks such as sentiment analysis, entity extraction, and content creation (text-bison). Fine-tuned for tasks that can be completed with one response, without the need for continuous conversation.'
    case 'chat-bison':
      return 'Google’s foundation model optimized for language understanding, language generation, and conversations (chat-bison). Fine-tuned to conduct natural multi-turn conversations, and for text tasks about code that require back-and-forth interactions.'
    case 'gemini-pro':
      return 'Preview of the latest family of generative AI models developed by Google DeepMind (gemini-pro). Suitable for testing and evaluations, not recommended for production usage due to restrictive rate limits under preview.'
    case 'command':
      return 'An instruction-following conversational model by Cohere that performs language tasks with high quality and reliability while providing longer context compared to generative models.'
    case 'mistral-small-latest':
      return 'Mistral Small is optimized for simpe tasks that one can do in bulk, like classification, customer support, or text generation. It offers performance at an affordable price point (mistral-small-latest).'
    case 'mistral-large-latest':
      return 'Mistral Large is optimized for complex tasks that require large reasoning capabilities or are highly specialized, like synthetic text generation, code generation, or agents (mistral-large-latest).'
    case 'meta-llama/Llama-2-70b-chat-hf':
      return 'Llama 2 is a collection of pretrained and fine-tuned generative text models developed and publicly released by Meta. This is the the 70B fine-tuned model, optimized for dialogue use cases and converted for the Hugging Face Transformers format (meta-llama/Llama-2-70b-chat-hf).'
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
    case 'claude-2':
      return 100000
    case 'claude-3-sonnet':
    case 'claude-3-opus':
      return 200000
    case 'text-bison':
    case 'chat-bison':
      // TODO should we separate max input tokens vs max output tokens? (8192 vs 1024)
      return 8192
    case 'gemini-pro':
      return 16384
    case 'command':
      return 4096
    case 'mistral-small-latest':
    case 'mistral-large-latest':
      return 32000
    case 'meta-llama/Llama-2-70b-chat-hf':
      return 4096
    default:
      return MaxTokensForModel(baseModelForModel(model))
  }
}

export const InputPriceForModel = (model: LanguageModel | EmbeddingModel): number => {
  switch (model) {
    case 'text-embedding-ada-002':
      return 0.1
    case 'text-embedding-3-small':
      return 0.02
    case 'text-embedding-3-large':
      return 0.13
    case 'gpt-3.5-turbo':
      return 1.5
    case 'gpt-3.5-turbo-16k':
      return 0.5
    case 'gpt-4':
      return 30
    case 'gpt-4-turbo':
      return 10
    case 'claude-instant-1':
      return 0.8
    case 'claude-2':
      return 8
    case 'claude-3-sonnet':
      return 3
    case 'claude-3-opus':
      return 15
    case 'command':
      return 15
    case 'mistral-small-latest':
      return 2
    case 'mistral-large-latest':
      return 8
    case 'mistral-embed':
      return 0.1
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'meta-llama/Llama-2-70b-chat-hf':
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
    case 'text-embedding-3-small':
      return 0.02
    case 'text-embedding-3-large':
      return 0.13
    case 'gpt-3.5-turbo':
      return 2
    case 'gpt-3.5-turbo-16k':
      return 1.5
    case 'gpt-4':
      return 60
    case 'gpt-4-turbo':
      return 30
    case 'claude-instant-1':
      return 2.4
    case 'claude-2':
      return 24
    case 'claude-3-sonnet':
      return 15
    case 'claude-3-opus':
      return 75
    case 'command':
      return 15
    case 'mistral-small-latest':
      return 6
    case 'mistral-large-latest':
      return 24
    case 'mistral-embed':
      return 0.1
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    case 'meta-llama/Llama-2-70b-chat-hf':
      return 0
    default:
      // TODO generalise when we extend fine-tuning support beyond gpt-3.5-turbo
      return 6
  }
}

export const IsModelFreeToUse = (model: LanguageModel | EmbeddingModel): boolean => {
  switch (model) {
    case 'text-embedding-ada-002':
    case 'text-embedding-3-small':
    case 'text-embedding-3-large':
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'command':
    case 'mistral-small-latest':
    case 'mistral-large-latest':
    case 'meta-llama/Llama-2-70b-chat-hf':
    default:
      return false
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
      return true
  }
}

export const IsSubscriptionRequiredForModel = (model: LanguageModel | EmbeddingModel): boolean => {
  switch (model) {
    case 'text-embedding-ada-002':
    case 'text-embedding-3-small':
    case 'text-embedding-3-large':
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-4':
    case 'gpt-4-turbo':
    case 'claude-instant-1':
    case 'claude-2':
    case 'claude-3-sonnet':
    case 'claude-3-opus':
    case 'command':
    case 'mistral-small-latest':
    case 'mistral-large-latest':
    case 'text-bison':
    case 'chat-bison':
    case 'gemini-pro':
    default:
      return false
    case 'meta-llama/Llama-2-70b-chat-hf':
      return true
  }
}

export const ValidatePromptConfig = (config: PromptConfig): PromptConfig => ({
  ...config,
  seed: SupportsSeed(config.model) ? config.seed : undefined,
  jsonMode: SupportsJsonMode(config.model) ? config.jsonMode ?? false : undefined,
})
