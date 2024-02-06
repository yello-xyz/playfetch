import { LanguageModel, PromptConfig } from '@/types'
import { PopupContent, PopupMenuItem } from '../popupMenu'
import {
  DescriptionForModel,
  LabelForModel,
  IconForProvider,
  InputPriceForModel,
  IsModelFreeToUse,
  LabelForProvider,
  MaxTokensForModel,
  OutputPriceForModel,
  ProviderForModel,
  WebsiteLinkForModel,
  IsSubscriptionRequiredForModel,
} from '@/src/common/providerMetadata'
import Icon from '../icon'
import { FormatCost, FormatLargeInteger } from '@/src/common/formatting'
import { useModelProviders } from '@/src/client/context/providerContext'
import { useState } from 'react'
import IconButton from '../iconButton'
import dotsIcon from '@/public/dots.svg'
import { useDefaultPromptConfig } from '@/src/client/context/userPresetsContext'
import { PromptConfigsAreEqual } from '@/src/common/versionsEqual'
import { ModelUnavailableWarning } from './modelUnavailableWarning'

export default function ModelInfoPane({
  model,
  config,
  setConfig,
  onDismiss,
}: {
  model: LanguageModel
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  onDismiss: () => void
}) {
  const [availableProviders, checkModelAvailable, checkProviderAvailable] = useModelProviders()

  const provider = ProviderForModel(model)
  const isModelAvailable = checkModelAvailable(model)

  const [showActionMenu, setShowActionMenu] = useState(false)
  const gridConfig = IsSubscriptionRequiredForModel(model) ? 'grid-cols-[140px_250px]' : 'grid-cols-[140px_180px]'

  return (
    <PopupContent className='relative p-3 w-[480px] ml-7 flex flex-col gap-1 shadow-sm'>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <span>{LabelForProvider(provider)} - </span>
        <span className='font-medium'>{LabelForModel(model, availableProviders)}</span>
        <ModelLabel model={model} />
        <div className='flex justify-end flex-1'>
          <IconButton icon={dotsIcon} onClick={() => setShowActionMenu(!showActionMenu)} />
        </div>
      </div>
      <HorizontalBorder />
      <div className='py-1 text-gray-500'>{DescriptionForModel(model, availableProviders)}</div>
      <div className={`grid ${gridConfig} text-gray-500 gap-y-0.5 pb-1`}>
        <span className='font-medium'>Context</span>
        <span>{FormatLargeInteger(MaxTokensForModel(model))} tokens</span>
        <HorizontalBorder />
        <HorizontalBorder />
        {IsSubscriptionRequiredForModel(model) ? (
          <>
            <span className='font-medium'>Pricing</span>
            <span>Requires Hugging Face Pro subscription</span>
          </>
        ) : (
          <>
            <span className='font-medium'>Input Pricing</span>
            <ModelCost model={model} mode='input' />
            <HorizontalBorder />
            <HorizontalBorder />
            <span className='font-medium'>Output Pricing</span>
            <ModelCost model={model} mode='output' />
          </>
        )}
        {IsModelFreeToUse(model) && <span className='mt-2'>*Fair use applies</span>}
      </div>
      {!isModelAvailable && (
        <ModelUnavailableWarning
          model={model}
          includeTitle={false}
          checkProviderAvailable={checkProviderAvailable}
          onDismiss={onDismiss}
        />
      )}
      {showActionMenu && (
        <ActionMenu model={model} config={config} setConfig={setConfig} onDismiss={() => setShowActionMenu(false)} />
      )}
    </PopupContent>
  )
}

const HorizontalBorder = () => <div className='h-1 border-b border-gray-200' />

export const ModelLabel = ({ model }: { model: LanguageModel }) => {
  const [defaultPromptConfig] = useDefaultPromptConfig()

  return IsModelFreeToUse(model) ? (
    <ModelSuffix label='Free' />
  ) : model === defaultPromptConfig.model ? (
    <ModelSuffix label='Default' color='bg-pink-400' />
  ) : null
}

const ModelSuffix = ({ label, color = 'bg-gray-400' }: { label: string; color?: string }) => (
  <span className={`${color} px-1 ml-1 text-[10px] leading-[17px] font-medium text-white rounded`}>{label}</span>
)

const ModelCost = ({ model, mode }: { model: LanguageModel; mode: 'input' | 'output' }) => {
  return IsModelFreeToUse(model) ? (
    <span>
      <span className='line-through'>{FormatCost(mode === 'input' ? 0.25 : 0.5)}</span> $0 / 1M characters*
    </span>
  ) : (
    <span>{FormatCost(mode === 'input' ? InputPriceForModel(model) : OutputPriceForModel(model))} / 1M tokens</span>
  )
}

const ActionMenu = ({
  model,
  config,
  setConfig,
  onDismiss,
}: {
  model: LanguageModel
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  onDismiss: () => void
}) => {
  const [defaultPromptConfig, updateDefaultModel, updateDefaultParameters] = useDefaultPromptConfig()
  const canSaveModel = model !== defaultPromptConfig.model
  const parametersAreEqual = PromptConfigsAreEqual({ ...config, model }, { ...defaultPromptConfig, model })
  const canSaveParameters = !parametersAreEqual
  const canResetParameters = !parametersAreEqual

  const withDismiss = (callback: () => void) => () => {
    onDismiss()
    callback()
  }

  const saveModelAsDefault = canSaveModel ? withDismiss(() => updateDefaultModel(model)) : undefined
  const saveParametersAsDefault = canSaveParameters
    ? withDismiss(() =>
        updateDefaultParameters({
          isChat: config.isChat,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          seed: config.seed,
          jsonMode: config.jsonMode,
        })
      )
    : undefined
  const resetToDefaultParameters = canResetParameters
    ? withDismiss(() => setConfig({ ...defaultPromptConfig, model: config.model }))
    : undefined
  const viewWebsite = () => window.open(WebsiteLinkForModel(model), '_blank')

  return (
    <PopupContent className='absolute w-52 right-3 top-10'>
      <PopupMenuItem title='Set as default' callback={saveModelAsDefault} first />
      <PopupMenuItem title='Save model parameters' callback={saveParametersAsDefault} separated />
      <PopupMenuItem title='Reset model parameters' callback={resetToDefaultParameters} />
      <PopupMenuItem title='View website' callback={withDismiss(viewWebsite)} separated last />
    </PopupContent>
  )
}
