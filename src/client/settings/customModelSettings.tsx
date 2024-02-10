import Label from '../components/label'
import {
  AvailableProvider,
  CustomModel,
  IsModelProvider,
  ModelProvider,
  QueryProvider,
  SourceControlProvider,
} from '@/types'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import Icon from '../components/icon'
import Button from '../components/button'
import TextInput from '../components/textInput'
import useInitialState from '@/src/client/components/useInitialState'
import { useState } from 'react'
import chevronIcon from '@/public/chevron.svg'

export default function CustomModelSettings({
  scopeID,
  provider,
  availableProviders,
  onRefresh,
}: {
  scopeID: number
  provider: ModelProvider | QueryProvider | SourceControlProvider
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
        <div className='flex flex-col gap-2 ml-6'>
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
  const [isEditing, setEditing] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const canUpdate = !isProcessing && name.length && !otherNames.includes(name)

  const updateModel = async (enabled: boolean) => {
    setProcessing(true)
    await api.updateProviderModel(scopeID, provider, model.id, name, description, enabled).then(onRefresh)
    setProcessing(false)
    setEditing(false)
  }

  const disableModel = () => {
    setDialogPrompt({
      title: `Are you sure you want to disable this model? This may affect published endpoints.`,
      callback: () => updateModel(false),
      destructive: true,
    })
  }

  return (
    <div className='flex flex-col gap-2 text-gray-700'>
      <div className='flex items-center gap-2.5'>
        <span className='flex-1'>{model.id}</span>
        {isEditing && (
          <Button type='outline' onClick={() => setEditing(false)} disabled={isProcessing}>
            Cancel
          </Button>
        )}
        <Button
          type={isEditing ? 'primary' : 'outline'}
          onClick={isEditing ? () => updateModel(true) : () => setEditing(true)}
          disabled={isEditing && !canUpdate}>
          {model.enabled ? (isEditing ? 'Update' : 'Edit') : 'Enable'}
        </Button>
        {model.enabled && !isEditing && (
          <Button type='destructive' onClick={disableModel} disabled={isProcessing}>
            Disable
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2.5'>
        {isEditing ? (
          <div className='w-80'>
            <TextInput placeholder='Short name for the model' value={name} setValue={setName} />
          </div>
        ) : (
          model.enabled && name && <Label className='-mt-2'>{name}</Label>
        )}
        {isEditing ? (
          <div className='w-full'>
            <TextInput placeholder='Short description of the model' value={description} setValue={setDescription} />
          </div>
        ) : (
          model.enabled && description && <Label className='-mt-2'>{description}</Label>
        )}
      </div>
    </div>
  )
}
