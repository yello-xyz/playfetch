import Label from '../components/label'
import { IconForProvider, LabelForProvider } from '@/src/common/providerMetadata'
import { AvailableProvider, IsModelProvider, ModelProvider, QueryProvider, SupportedProvider } from '@/types'
import { ReactNode, useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import Icon from '../components/icon'
import Button from '../components/button'
import TextInput from '../components/textInput'
import CustomModelSettings from './customModelSettings'

export default function ProviderSettings({
  scopeID,
  providers,
  availableProviders,
  includeEnvironment,
  onRefresh,
}: {
  scopeID: number
  providers: ModelProvider[] | QueryProvider[]
  availableProviders: AvailableProvider[]
  includeEnvironment?: boolean
  onRefresh: () => void
}) {
  return (
    <>
      {providers.map((provider, index) => (
        <DefaultProviderRow
          key={index}
          scopeID={scopeID}
          provider={provider}
          availableProvider={availableProviders.find(p => p.provider === provider)}
          availableProviders={availableProviders}
          includeEnvironment={includeEnvironment}
          onRefresh={onRefresh}
        />
      ))}
    </>
  )
}

function DefaultProviderRow({
  scopeID,
  provider,
  availableProvider,
  availableProviders,
  includeEnvironment,
  onRefresh,
}: {
  scopeID: number
  provider: ModelProvider | QueryProvider
  availableProvider?: AvailableProvider
  availableProviders: AvailableProvider[]
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

  const isProviderAvailable = availableProvider && !isUpdating

  return (
    <ProviderRow provider={provider} flexLayout={availableProvider || isUpdating ? 'flex-col' : 'justify-between'}>
      <div className='flex items-center gap-2.5'>
        {isProviderAvailable && (
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
          {isProviderAvailable && (
            <Button type='destructive' disabled={isProcessing} onClick={removeKey}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {isUpdating && provider === 'huggingface' && (
        <span>Models may require a Hugging Face Pro subscription to run.</span>
      )}
      {isUpdating && <span>Your key will be encrypted using AES 256 and stored securely.</span>}
      <CustomModelSettings
        scopeID={scopeID}
        provider={provider}
        availableProviders={availableProviders}
        onRefresh={onRefresh}
      />
    </ProviderRow>
  )
}

export function ProviderRow({
  provider,
  flexLayout = 'justify-between',
  children,
}: {
  provider: SupportedProvider
  flexLayout?: string
  children?: ReactNode
}) {
  const label = LabelForProvider(provider)

  return (
    <div className={`flex ${flexLayout} gap-2 p-3 bg-white border border-gray-200 rounded-lg`}>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <Label className='w-40'>{label}</Label>
      </div>
      {children}
    </div>
  )
}
