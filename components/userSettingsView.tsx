import { useLoggedInUser } from '@/src/client/context/userContext'
import Label from './label'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllProviders, IconForProvider, LabelForProvider } from '@/src/common/providerMetadata'
import { AvailableProvider, ModelProvider } from '@/types'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { FormatCost } from '@/src/common/formatting'
import Icon from './icon'
import Button from './button'
import TextInput from './textInput'

const labelFor = (provider: ModelProvider) => LabelForProvider(provider)

export default function UserSettingsView() {
  const user = useLoggedInUser()

  const allProviders = AllProviders.sort((a, b) => labelFor(a).localeCompare(labelFor(b))).filter(
    provider => provider !== DefaultProvider
  )
  const [availableProviders, setAvailableProviders] = useState(user.availableProviders)

  const refresh = () => api.getAvailableProviders().then(setAvailableProviders)

  return (
    <div className='flex flex-col items-start flex-1 gap-3 p-6 text-gray-500 max-w-[680px]'>
      <ProviderSettingsPane providers={allProviders} availableProviders={availableProviders} onRefresh={refresh} />
    </div>
  )
}

function ProviderSettingsPane({
  providers,
  availableProviders,
  onRefresh,
}: {
  providers: ModelProvider[]
  availableProviders: AvailableProvider[]
  onRefresh: () => void
}) {
  return (
    <>
      <Label>Manage API keys</Label>
      <span>
        Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign
        up for an account and get an API key from them.
      </span>
      <div className='flex flex-col w-full gap-3'>
        {providers.map((provider, index) => (
          <ProviderRow
            key={index}
            provider={provider}
            availableProvider={availableProviders.find(p => p.provider === provider)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </>
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
  const label = labelFor(provider)

  const [showAPIKeyPrompt, setShowAPIKeyPrompt] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const updateKey = (apiKey: string | null) => api.updateProviderKey(provider, apiKey).then(onRefresh)

  const removeKey = () => {
    setDialogPrompt({
      title: `Are you sure you want to unlink your ${label} API key? This may affect published endpoints.`,
      callback: () => updateKey(null),
      destructive: true,
    })
  }

  const flexLayout = availableProvider ? 'flex-col' : 'justify-between'

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
        {availableProvider ? <TextInput disabled value={Array.from({ length: 48 }, _ => '•').join('')} /> : undefined}
        <div className='flex gap-2.5 justify-end grow cursor-pointer'>
          <Button type='outline' onClick={() => setShowAPIKeyPrompt(true)}>
            {availableProvider ? 'Update' : 'Configure'}
          </Button>
          {availableProvider && (
            <Button type='destructive' onClick={removeKey}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {showAPIKeyPrompt && (
        <PickNameDialog
          title='Add API Key'
          confirmTitle='Save'
          label={`${label} API key`}
          onConfirm={updateKey}
          onDismiss={() => setShowAPIKeyPrompt(false)}
        />
      )}
    </div>
  )
}
