import { useLoggedInUser } from '@/src/client/context/userContext'
import Label from './label'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllProviders, LabelForProvider } from './modelSelector'
import { AvailableProvider, ModelProvider } from '@/types'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { FormatCost } from '@/src/common/formatting'

export default function UserSettingsView() {
  const user = useLoggedInUser()

  const allProviders = AllProviders.filter(provider => provider !== DefaultProvider)
  const [availableProviders, setAvailableProviders] = useState(user.availableProviders)

  const refresh = () => api.getAvailableProviders().then(setAvailableProviders)

  return (
    <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
      <div className='text-base font-medium text-gray-800'>Settings</div>
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
      <Label>API Keys</Label>
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
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
  const truncatedAPIKey = availableProvider?.truncatedAPIKey ?? ''
  const haveAPIKey = truncatedAPIKey.length > 0

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
    <div className='flex items-center justify-between gap-4'>
      <Label className='w-40'>{label}</Label>
      {truncatedAPIKey}
      <div className='underline cursor-pointer' onClick={haveAPIKey ? removeKey : () => setShowAPIKeyPrompt(true)}>
        {haveAPIKey ? 'remove' : 'add key'}
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
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
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
