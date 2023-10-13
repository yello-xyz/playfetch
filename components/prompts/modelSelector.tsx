import { AvailableModelProvider, LanguageModel, ModelProvider } from '@/types'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import Icon from '../icon'
import { PopupButton } from '../popupButton'
import { PopupContent, PopupLabelItem } from '../popupMenu'
import ModelInfoPane from './modelInfoPane'
import {
  DefaultLanguageModels,
  FullLabelForModel,
  IconForProvider,
  LabelForModel,
  ProviderForModel,
} from '@/src/common/providerMetadata'
import { useModelProviders } from '@/src/client/hooks/useAvailableProviders'

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
  const [availableProviders, checkModelAvailable] = useModelProviders()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(
      ModelSelectorPopup,
      { selectedModel: model, onSelectModel: setModel, checkModelAvailable, availableProviders },
      location
    )

  return (
    <PopupButton popUpAbove={popUpAbove} onSetPopup={onSetPopup}>
      <Icon icon={IconForProvider(ProviderForModel(model))} />
      <span className='flex-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>
        {LabelForModel(model, availableProviders)}
      </span>
    </PopupButton>
  )
}

type ModelSelectorPopupProps = {
  selectedModel: LanguageModel
  onSelectModel: (model: LanguageModel) => void
  checkModelAvailable: (model: LanguageModel) => boolean
  availableProviders: AvailableModelProvider[]
}

function ModelSelectorPopup({
  selectedModel,
  onSelectModel,
  checkModelAvailable,
  availableProviders,
  withDismiss,
}: ModelSelectorPopupProps & WithDismiss) {
  const allModels = [
    ...DefaultLanguageModels,
    ...availableProviders.flatMap(provider => provider.customModels.map(model => model.id)),
  ]
  return (
    <PopupContent className='relative p-3 w-52' autoOverflow={false}>
      {allModels
        .sort((a, b) =>
          FullLabelForModel(a, availableProviders, true).localeCompare(FullLabelForModel(b, availableProviders, true))
        )
        .map((model, index) => (
          <div key={index} className='group'>
            <PopupLabelItem
              label={FullLabelForModel(model, availableProviders, false)}
              icon={IconForProvider(ProviderForModel(model))}
              onClick={withDismiss(() => onSelectModel(model))}
              disabled={!checkModelAvailable(model)}
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
