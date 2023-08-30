import { useLoggedInUser } from '@/src/client/context/userContext'
import Label from './label'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllProviders, IconForProvider, LabelForProvider } from './modelSelector'
import { AvailableProvider, ModelProvider } from '@/types'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { FormatCost } from '@/src/common/formatting'
import Icon from './icon'
import Button from './button'
import TextInput from './textInput'

export default function UserSettingsView() {
  const user = useLoggedInUser()

  const allProviders = AllProviders.filter(provider => provider !== DefaultProvider)
  const [availableProviders, setAvailableProviders] = useState(user.availableProviders)

  const refresh = () => api.getAvailableProviders().then(setAvailableProviders)

  return (
    <div className='flex flex-col items-start flex-1 gap-3 p-6 text-gray-500 max-w-[680px]'>
      <ProviderSettingsPane providers={allProviders} availableProviders={availableProviders} onRefresh={refresh} />
      <CostPane availableProviders={user.availableProviders} />
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
        Provide your API credentials here to enable integration with AI services like OpenAI. To get started, you'll
        need to sign up for accounts with one or more services and get API keys from them.
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
  const label = LabelForProvider(provider)

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

  return (
    <div className='flex items-center gap-2.5 p-3 bg-white border border-gray-200 rounded-lg'>
      <Icon icon={IconForProvider(provider)} />
      <Label className='w-40'>{label}</Label>
      {availableProvider ? <TextInput disabled value={Array.from({ length: 48 }, _ => '•').join('')} /> : undefined}
      <div
        className='flex justify-end flex-grow cursor-pointer'
        onClick={availableProvider ? removeKey : () => setShowAPIKeyPrompt(true)}>
        <Button
          type={availableProvider ? 'destructive' : 'outline'}
          onClick={availableProvider ? removeKey : () => setShowAPIKeyPrompt(true)}>
          {availableProvider ? 'Remove' : 'Configure'}
        </Button>
      </div>
      {showAPIKeyPrompt && (
        <PickNameDialog
          title='Link API Key'
          confirmTitle='Save'
          label={label}
          onConfirm={updateKey}
          onDismiss={() => setShowAPIKeyPrompt(false)}
        />
      )}
    </div>
  )
}

function CostPane({ availableProviders }: { availableProviders: AvailableProvider[] }) {
  const nonZeroCostProviders = availableProviders.filter(p => p.cost > 0)

  return nonZeroCostProviders.length ? (
    <>
      <Label>Running Cost</Label>
      <div className='flex flex-col w-full gap-4 p-6 py-4 bg-white border border-gray-200 rounded-lg'>
        {nonZeroCostProviders
          .sort((a, b) => b.cost - a.cost)
          .filter(p => p.provider !== DefaultProvider)
          .map((provider, index) => (
            <CostRow key={index} availableProvider={provider} />
          ))}
      </div>
    </>
  ) : null
}

function CostRow({ availableProvider }: { availableProvider: AvailableProvider }) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <Label className='w-40'>{LabelForProvider(availableProvider.provider)}</Label>
      {FormatCost(availableProvider.cost ?? 0)}
    </div>
  )
}
