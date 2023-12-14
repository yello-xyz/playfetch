import Label from '../label'
import { IconForProvider, LabelForProvider, SourceControlProviders } from '@/src/common/providerMetadata'
import { AvailableProvider, IsModelProvider, ModelProvider, QueryProvider, SourceControlProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import Icon from '../icon'
import Button from '../button'
import TextInput from '../textInput'
import CustomModelSettings from './customModelSettings'
import Link from 'next/link'

export default function ProviderSettings({
  scopeID,
  providers,
  availableProviders,
  includeEnvironment,
  excludeApiKey,
  onRefresh,
}: {
  scopeID: number
  providers: ModelProvider[] | QueryProvider[] | SourceControlProvider[]
  availableProviders: AvailableProvider[]
  includeEnvironment?: boolean
  excludeApiKey?: boolean
  onRefresh: () => void
}) {
  return (
    <>
      {providers.map((provider, index) => (
        <ProviderRow
          key={index}
          scopeID={scopeID}
          provider={provider}
          availableProvider={availableProviders.find(p => p.provider === provider)}
          availableProviders={availableProviders}
          includeEnvironment={includeEnvironment}
          excludeApiKey={excludeApiKey}
          onRefresh={onRefresh}
        />
      ))}
    </>
  )
}

function ProviderRow({
  scopeID,
  provider,
  availableProvider,
  availableProviders,
  includeEnvironment,
  excludeApiKey,
  onRefresh,
}: {
  scopeID: number
  provider: ModelProvider | QueryProvider | SourceControlProvider
  availableProvider?: AvailableProvider
  availableProviders: AvailableProvider[]
  includeEnvironment?: boolean
  excludeApiKey?: boolean
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
  const flexLayout = availableProvider || isUpdating ? 'flex-col' : 'justify-between'

  return (
    <div className={`flex ${flexLayout} gap-2 p-3 bg-white border border-gray-200 rounded-lg`}>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <Label className='w-40'>{label}</Label>
      </div>
      <div className='flex items-center gap-2.5'>
        {isProviderAvailable && (
          <>
            {!excludeApiKey && <TextInput disabled value={Array.from({ length: 48 }, _ => '•').join('')} />}
            {includeEnvironment && previousEnvironment && <TextInput disabled value={previousEnvironment} />}
          </>
        )}
        {isUpdating && !excludeApiKey && (
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
          {excludeApiKey ? (
            <Link href={process.env.NEXT_PUBLIC_GITHUB_APP_LINK ?? ''}>
              <div className='px-4 py-2 font-medium border border-gray-200 rounded-lg hover:bg-gray-100'>
                {availableProvider ? 'Reinstall' : 'Install'}
              </div>
            </Link>
          ) : (
            <Button type='outline' disabled={isProcessing} onClick={() => toggleUpdate(!isUpdating)}>
              {isUpdating ? 'Cancel' : availableProvider ? 'Update' : 'Configure'}
            </Button>
          )}
          {isProviderAvailable && (
            <Button type='destructive' disabled={isProcessing} onClick={removeKey}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {isUpdating && !excludeApiKey && <span>Your key will be encrypted using AES 256 and stored securely.</span>}
      <CustomModelSettings
        scopeID={scopeID}
        provider={provider}
        availableProviders={availableProviders}
        onRefresh={onRefresh}
      />
    </div>
  )
}
