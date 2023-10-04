import Label from '../label'
import { IconForProvider, LabelForProvider } from '@/src/common/providerMetadata'
import { AvailableProvider, ModelProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { FormatCost } from '@/src/common/formatting'
import Icon from '../icon'
import Button from '../button'
import TextInput from '../textInput'
import SettingsPane from './settingsPane'

export default function ProviderSettingsPane({
  providers,
  availableProviders,
  onRefresh,
}: {
  providers: ModelProvider[]
  availableProviders: AvailableProvider[]
  onRefresh: () => void
}) {
  return (
    <SettingsPane
      title='Manage API keys'
      description='Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'>
      {providers.map((provider, index) => (
        <ProviderRow
          key={index}
          provider={provider}
          availableProvider={availableProviders.find(p => p.provider === provider)}
          onRefresh={onRefresh}
        />
      ))}
    </SettingsPane>
  )
}

function ProviderRow({
  provider,
  availableProvider,
  onRefresh,
}: {
  provider: ModelProvider
  availableProvider?: AvailableProvider
  onRefresh: () => void
}) {
  const label = LabelForProvider(provider)

  const [apiKey, setAPIKey] = useState('')
  const [isUpdating, setUpdating] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  const toggleUpdate = () => {
    setUpdating(!isUpdating)
    setAPIKey('')
  }

  const updateKey = async (apiKey: string | null) => {
    setProcessing(true)
    await api.updateProviderKey(provider, apiKey).then(onRefresh)
    setAPIKey('')
    setUpdating(false)
    setProcessing(false)
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
          <TextInput disabled value={Array.from({ length: 48 }, _ => '•').join('')} />
        )}
        {isUpdating && (
          <TextInput disabled={isProcessing} value={apiKey} setValue={setAPIKey} placeholder={`${label} API Key`} />
        )}
        <div className='flex gap-2.5 justify-end grow cursor-pointer'>
          {isUpdating && (
            <Button type='primary' disabled={!apiKey.length || isProcessing} onClick={() => updateKey(apiKey)}>
              Add
            </Button>
          )}
          <Button type='outline' disabled={isProcessing} onClick={toggleUpdate}>
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
