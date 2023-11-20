import { LanguageModel, PromptConfig } from '@/types'
import { PopupContent, PopupMenuItem } from '../popupMenu'
import {
  DescriptionForModel,
  FullLabelForModel,
  IconForProvider,
  InputPriceForModel,
  IsModelFreeToUse,
  LabelForProvider,
  MaxTokensForModel,
  OutputPriceForModel,
  ProviderForModel,
  WebsiteLinkForModel,
} from '@/src/common/providerMetadata'
import Icon from '../icon'
import { ModelUnavailableWarning } from './promptPanel'
import { FormatCost, FormatLargeInteger } from '@/src/common/formatting'
import { useModelProviders } from '@/src/client/context/providerContext'
import { useState } from 'react'
import IconButton from '../iconButton'
import dotsIcon from '@/public/dots.svg'
import { useDefaultPromptConfig } from '@/src/client/context/promptConfigContext'
import { PromptConfigsAreEqual } from '@/src/common/versionsEqual'

export default function ModelInfoPane({
  model,
  config,
  setConfig,
}: {
  model: LanguageModel
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
}) {
  const [availableProviders, checkModelAvailable, checkProviderAvailable] = useModelProviders()

  const provider = ProviderForModel(model)
  const isModelAvailable = checkModelAvailable(model)

  const [showActionMenu, setShowActionMenu] = useState(false)

  return (
    <PopupContent className='relative p-3 w-[480px] ml-7 flex flex-col gap-1'>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <span>{LabelForProvider(provider)} - </span>
        <span className='font-medium'>{FullLabelForModel(model, availableProviders)}</span>
        <LabelForModel model={model} />
        <div className='flex justify-end flex-1'>
          <IconButton icon={dotsIcon} onClick={() => setShowActionMenu(!showActionMenu)} />
        </div>
      </div>
      <HorizontalBorder />
      <div className='py-1 text-gray-500'>{DescriptionForModel(model, availableProviders)}</div>
      <div className='grid grid-cols-[140px_180px] text-gray-500 gap-y-0.5 pb-1'>
        <span className='font-medium'>Context</span>
        <span>{FormatLargeInteger(MaxTokensForModel(model))} tokens</span>
        <HorizontalBorder />
        <HorizontalBorder />
        <span className='font-medium'>Input Pricing</span>
        <ModelCost model={model} price={InputPriceForModel} />
        <HorizontalBorder />
        <HorizontalBorder />
        <span className='font-medium'>Output Pricing</span>
        <ModelCost model={model} price={OutputPriceForModel} />
        {IsModelFreeToUse(model) && <span className='mt-2'>*Fair use applies</span>}
      </div>
      {!isModelAvailable && (
        <ModelUnavailableWarning model={model} includeTitle={false} checkProviderAvailable={checkProviderAvailable} />
      )}
      {showActionMenu && (
        <ActionMenu model={model} config={config} setConfig={setConfig} onDismiss={() => setShowActionMenu(false)} />
      )}
    </PopupContent>
  )
}

const HorizontalBorder = () => <div className='h-1 border-b border-gray-200' />

export const LabelForModel = ({ model }: { model: LanguageModel }) => {
  const [defaultPromptConfig] = useDefaultPromptConfig()

  return IsModelFreeToUse(model) ? (
    <ModelLabel label='Free' />
  ) : model === defaultPromptConfig.model ? (
    <ModelLabel label='Default' color='bg-pink-400' />
  ) : null
}
const ModelLabel = ({ label, color = 'bg-gray-400' }: { label: string; color?: string }) => (
  <span className={`${color} px-1 ml-1 text-[10px] leading-[17px] font-medium text-white rounded`}>{label}</span>
)

const ModelCost = ({ model, price }: { model: LanguageModel; price: (model: LanguageModel) => number }) => {
  return IsModelFreeToUse(model) ? (
    <span>
      <span className='line-through'>{FormatCost(0.5)}</span> $0 / 1M characters*
    </span>
  ) : (
    <span>{FormatCost(price(model))} / 1M tokens</span>
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
        updateDefaultParameters({ isChat: config.isChat, maxTokens: config.maxTokens, temperature: config.temperature })
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
