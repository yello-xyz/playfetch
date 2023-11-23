import Label from '../label'
import { IconForProvider, LabelForProvider } from '@/src/common/providerMetadata'
import { AvailableProvider, CustomModel, IsModelProvider, ModelProvider, QueryProvider } from '@/types'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import Icon from '../icon'
import Button from '../button'
import TextInput from '../textInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import { useState } from 'react'
import chevronIcon from '@/public/chevron.svg'

export default function CustomModelSettings({
  scopeID,
  provider,
  availableProviders,
  onRefresh,
}: {
  scopeID: number
  provider: ModelProvider | QueryProvider
  availableProviders: AvailableProvider[]
  onRefresh: () => void
}) {
  const providerMap = {} as { [id: string]: ModelProvider }
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  availableModelProviders.forEach(provider =>
    provider.customModels.forEach(model => (providerMap[model.id] = provider.provider))
  )
  const allCustomModels = availableModelProviders.flatMap(provider => provider.customModels)
  const otherNames = (model: CustomModel) => allCustomModels.filter(m => m.id !== model.id).map(m => m.name)

  const availableProvider = availableProviders.find(p => p.provider === provider)
  const customModels = availableProvider && IsModelProvider(availableProvider) ? availableProvider.customModels : []
  const [areCustomModelsExpanded, setCustomModelsExpanded] = useState(false)

  return customModels.length > 0 ? (
    <div>
      <div
        className='flex items-center cursor-pointer'
        onClick={() => setCustomModelsExpanded(!areCustomModelsExpanded)}>
        <Icon className={`${areCustomModelsExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className='font-medium text-gray-700'>Custom Models</span>
      </div>
      {areCustomModelsExpanded && (
        <div className='ml-6'>
          {customModels.map((model, index) => (
            <ModelRow
              key={index}
              scopeID={scopeID}
              provider={providerMap[model.id]}
              model={model}
              otherNames={otherNames(model)}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  ) : null
}

function ModelRow({
  scopeID,
  provider,
  model,
  otherNames,
  onRefresh,
}: {
  scopeID: number
  provider: ModelProvider
  model: CustomModel
  otherNames: string[]
  onRefresh: () => void
}) {
  const [name, setName] = useInitialState(model.name)
  const [description, setDescription] = useInitialState(model.description)
  const [isProcessing, setProcessing] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const label = LabelForProvider(provider)
  const canUpdate = !isProcessing && name.length && !otherNames.includes(name)

  const updateModel = async (enabled: boolean) => {
    setProcessing(true)
    await api.updateProviderModel(scopeID, provider, model.id, name, description, enabled).then(onRefresh)
    setProcessing(false)
  }

  const disableModel = () => {
    setDialogPrompt({
      title: `Are you sure you want to disable this model? This may affect published endpoints.`,
      callback: () => updateModel(false),
      destructive: true,
    })
  }

  return (
    <div className={`flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg`}>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <Label className='w-40'>{label}</Label>
        <div className='flex justify-end font-medium grow whitespace-nowrap'>{model.id}</div>
      </div>
      <div className='flex items-center gap-2.5'>
        <div className='w-40'>
          <TextInput placeholder='Short Name' value={name} setValue={setName} />
        </div>
        <TextInput placeholder='Description' value={description} setValue={setDescription} />
        <div className='flex gap-2.5 justify-end grow cursor-pointer'>
          <Button type={model.enabled ? 'outline' : 'primary'} onClick={() => updateModel(true)} disabled={!canUpdate}>
            {model.enabled ? 'Update' : 'Enable'}
          </Button>
          {model.enabled && (
            <Button type='destructive' onClick={disableModel} disabled={isProcessing}>
              Disable
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
