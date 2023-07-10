import { PromptConfig, ProviderModel } from "@/types"

export const DefaultProvider: ProviderModel = 'google'

export const DefaultConfig: PromptConfig = {
  provider: DefaultProvider,
  temperature: 0.5,
  maxTokens: 250,
}

