import { AvailableModelProvider, LanguageModel, PromptConfig } from '@/types'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import Icon from '../icon'
import { PopupButton } from '../popupButton'
import { PopupContent, PopupLabelItem } from '../popupMenu'
import ModelInfoPane, { ModelLabel } from './modelInfoPane'
import {
  PublicLanguageModels,
  FullLabelForModel,
  LabelForModel,
  GatedLanguageModels,
  IconForProvider,
  ProviderForModel,
} from '@/src/common/providerMetadata'
import { useModelProviders } from '@/src/client/context/providerContext'

export default function ModelSelector({
  config,
  setConfig,
  popUpAbove,
  disabled,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  popUpAbove?: boolean
  disabled?: boolean
}) {
  const setPopup = useGlobalPopup<ModelSelectorPopupProps>()
  const [availableProviders, checkModelAvailable] = useModelProviders()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(ModelSelectorPopup, { config, setConfig, checkModelAvailable, availableProviders }, location)

  return (
    <PopupButton popUpAbove={popUpAbove} onSetPopup={onSetPopup} disabled={disabled}>
      <Icon icon={IconForProvider(ProviderForModel(config.model))} />
      <span className='flex-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>
        {LabelForModel(config.model, availableProviders)}
      </span>
    </PopupButton>
  )
}

type ModelSelectorPopupProps = {
  checkModelAvailable: (model: LanguageModel) => boolean
  availableProviders: AvailableModelProvider[]
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
}

function ModelSelectorPopup({
  checkModelAvailable,
  availableProviders,
  config,
  setConfig,
  withDismiss,
}: ModelSelectorPopupProps & WithDismiss) {
  const gatedModels = availableProviders.flatMap(provider => provider.gatedModels)
  const allModels = [
    ...PublicLanguageModels,
    ...GatedLanguageModels.filter(model => gatedModels.includes(model)),
    ...availableProviders.flatMap(provider => provider.customModels.map(model => model.id)),
  ]

  const onSelectModel = (model: LanguageModel) => setConfig({ ...config, model })

  return (
    <PopupContent className='relative w-64 p-3' autoOverflow={false}>
      {allModels
        .sort((a, b) =>
          FullLabelForModel(a, availableProviders).localeCompare(FullLabelForModel(b, availableProviders))
        )
        .map((model, index) => (
          <div key={index} className='group'>
            <PopupLabelItem
              title={LabelForModel(model, availableProviders)}
              icon={IconForProvider(ProviderForModel(model))}
              label={<ModelLabel model={model} />}
              onClick={withDismiss(() => onSelectModel(model))}
              disabled={!checkModelAvailable(model)}
              checked={model === config.model}
            />
            <div className='absolute top-0 bottom-0 hidden left-[232px] group-hover:block hover:block'>
              <ModelInfoPane model={model} config={config} setConfig={setConfig} />
            </div>
          </div>
        ))}
    </PopupContent>
  )
}
