import Label from '../label'
import { IconForProvider, LabelForProvider } from '@/src/common/providerMetadata'
import { AvailableProvider, IsModelProvider, ModelProvider, QueryProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { FormatCost } from '@/src/common/formatting'
import Icon from '../icon'
import Button from '../button'
import TextInput from '../textInput'
import SettingsPane from './settingsPane'

export default function ProviderSettingsPane({
  scopeID,
  title,
  description,
  providers,
  availableProviders,
  includeEnvironment,
  onRefresh,
}: {
  scopeID: number
  title: string
  description: string
  providers: ModelProvider[] | QueryProvider[]
  availableProviders: AvailableProvider[]
  includeEnvironment?: boolean
  onRefresh: () => void
}) {
  return (
    <SettingsPane title={title} description={description}>
      {providers.map((provider, index) => (
        <ProviderRow
          key={index}
          scopeID={scopeID}
          provider={provider}
          availableProvider={availableProviders.find(p => p.provider === provider)}
          includeEnvironment={includeEnvironment}
          onRefresh={onRefresh}
        />
      ))}
    </SettingsPane>
  )
}

function ProviderRow({
  scopeID,
  provider,
  availableProvider,
  includeEnvironment,
  onRefresh,
}: {
  scopeID: number
  provider: ModelProvider | QueryProvider
  availableProvider?: AvailableProvider
  includeEnvironment?: boolean
  onRefresh: () => void
}) {
  const label = LabelForProvider(provider)
  const previousEnvironment =
    availableProvider && !IsModelProvider(availableProvider) ? availableProvider.environment : undefined

  const [apiKey, setAPIKey] = useState('')
  const [environment, setEnvironment] = useState(previousEnvironment)
  const [isUpdating, setUpdating] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  const toggleUpdate = (updating: boolean) => {
    setUpdating(updating)
    setAPIKey('')
    setEnvironment(previousEnvironment)
  }

  const updateKey = async (apiKey: string | null) => {
    setProcessing(true)
    await api.updateProviderKey(scopeID, provider, apiKey, environment).then(onRefresh)
    setProcessing(false)
    toggleUpdate(false)
  }

  const setDialogPrompt = useModalDialogPrompt()
  const removeKey = () => {
    setDialogPrompt({
      title: `Are you sure you want to unlink your ${label} API key? This may affect published endpoints.`,
      callback: () => updateKey(null),
      destructive: true,
    })
  }

  const flexLayout = availableProvider || isUpdating ? 'flex-col' : 'justify-between'

  return (
    <div className={`flex ${flexLayout} gap-2 p-3 bg-white border border-gray-200 rounded-lg`}>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <Label className='w-40'>{label}</Label>
        {availableProvider && availableProvider.cost > 0 && (
          <div className='flex justify-end text-xs grow'>{FormatCost(availableProvider.cost)}</div>
        )}
      </div>
      <div className='flex items-center gap-2.5'>
        {availableProvider && !isUpdating && (
          <>
            <TextInput disabled value={Array.from({ length: 48 }, _ => '•').join('')} />
            {includeEnvironment && previousEnvironment && <TextInput disabled value={previousEnvironment} />}
          </>
        )}
        {isUpdating && (
          <>
            <TextInput disabled={isProcessing} value={apiKey} setValue={setAPIKey} placeholder={`${label} API Key`} />
            {includeEnvironment && (
              <TextInput
                disabled={isProcessing}
                value={environment ?? ''}
                setValue={setEnvironment}
                placeholder='Environment'
              />
            )}
          </>
        )}
        <div className='flex gap-2.5 justify-end grow cursor-pointer'>
          {isUpdating && (
            <Button
              type='primary'
              disabled={!apiKey.length || (includeEnvironment && !environment?.length) || isProcessing}
              onClick={() => updateKey(apiKey)}>
              {availableProvider ? 'Update' : 'Add'}
            </Button>
          )}
          <Button type='outline' disabled={isProcessing} onClick={() => toggleUpdate(!isUpdating)}>
            {isUpdating ? 'Cancel' : availableProvider ? 'Update' : 'Configure'}
          </Button>
          {availableProvider && !isUpdating && (
            <Button type='destructive' disabled={isProcessing} onClick={removeKey}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
