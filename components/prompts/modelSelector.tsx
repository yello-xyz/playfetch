import { LanguageModel, ModelProvider, Prompts } from '@/types'
import openaiIcon from '@/public/openai.svg'
import anthropicIcon from '@/public/anthropic.svg'
import googleIcon from '@/public/google.svg'
import cohereIcon from '@/public/cohere.svg'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import Icon from '../icon'
import { PopupButton } from '../popupButton'
import { PopupContent, PopupLabelItem } from '../popupMenu'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import ModelInfoPane from './modelInfoPane'

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

export const AllProviders = (['openai', 'anthropic', 'google', 'cohere'] as ModelProvider[]).sort((a, b) =>
  LabelForProvider(a).localeCompare(LabelForProvider(b))
)

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
      return 'GPT-3.5'
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

const allModels: LanguageModel[] = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-instant-1',
  'claude-2',
  'text-bison@001',
  'command',
]

const sortedModels = allModels.sort((a, b) => FullLabelForModel(a).localeCompare(FullLabelForModel(b)))

export default function ModelSelector({
  model,
  setModel,
  popUpAbove,
}: {
  model: LanguageModel
  setModel: (model: LanguageModel) => void
  popUpAbove?: boolean
}) {
  const setPopup = useGlobalPopup<ModelSelectorPopupProps>()
  const checkProvider = useCheckProvider()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(ModelSelectorPopup, { selectedModel: model, onSelectModel: setModel, checkProvider }, location)

  return (
    <PopupButton popUpAbove={popUpAbove} onSetPopup={onSetPopup}>
      <Icon icon={IconForProvider(ProviderForModel(model))} />
      <span className='flex-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>
        {LabelForModel(model)}
      </span>
    </PopupButton>
  )
}

type ModelSelectorPopupProps = {
  selectedModel: LanguageModel
  onSelectModel: (model: LanguageModel) => void
  checkProvider: (provider: ModelProvider) => boolean
}

function ModelSelectorPopup({
  selectedModel,
  onSelectModel,
  checkProvider,
  withDismiss,
}: ModelSelectorPopupProps & WithDismiss) {
  return (
    <PopupContent className='relative p-3 w-52' autoOverflow={false}>
      {sortedModels.map((model, index) => (
        <div className='group'>
          <PopupLabelItem
            key={index}
            label={FullLabelForModel(model, false)}
            icon={IconForProvider(ProviderForModel(model))}
            onClick={withDismiss(() => onSelectModel(model))}
            disabled={!checkProvider(ProviderForModel(model))}
            checked={model === selectedModel}
          />
          <div className='absolute top-0 bottom-0 hidden left-[184px] group-hover:block hover:block'>
            <ModelInfoPane model={model} />
          </div>
        </div>
      ))}
    </PopupContent>
  )
}
