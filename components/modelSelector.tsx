import { LanguageModel, ModelProvider } from '@/types'
import DropdownMenu from './dropdownMenu'

export const LabelForProvider = (provider: ModelProvider) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    case 'google':
      return 'Google'
  }
}

export const AllProviders = (['openai', 'anthropic', 'google'] as ModelProvider[]).sort((a, b) =>
  LabelForProvider(a).localeCompare(LabelForProvider(b))
)

export const ProviderForModel = (model: LanguageModel): ModelProvider => {
  switch (model) {
    case 'gpt-3.5':
      return 'openai'
    case 'claude-v1':
      return 'anthropic'
    case 'palm-v2':
      return 'google'
  }
}

const labelForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5':
      return 'GPT-3.5'
    case 'claude-v1':
      return 'Claude v1'
    case 'palm-v2':
      return 'PaLM v2'
  }
}

const fullLabelForModel = (model: LanguageModel) =>
  `${LabelForProvider(ProviderForModel(model))} - ${labelForModel(model)}`

const allModels = (['gpt-3.5', 'claude-v1', 'palm-v2'] as LanguageModel[]).sort((a, b) =>
  fullLabelForModel(a).localeCompare(fullLabelForModel(b))
)

export default function ModelSelector({
  model,
  setModel,
}: {
  model: LanguageModel
  setModel: (model: LanguageModel) => void
}) {
  return (
    <DropdownMenu size='medium' value={model} onChange={value => setModel(value as LanguageModel)}>
      {allModels.map((model, index) => (
        <option key={index} value={model}>
          {fullLabelForModel(model)}
        </option>
      ))}
    </DropdownMenu>
  )
}
