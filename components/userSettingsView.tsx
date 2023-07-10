import { useLoggedInUser } from './userContext'
import Label from './label'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllProviders, LabelForProvider } from './modelSelector'
import { AvailableProvider, ModelProvider } from '@/types'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import api from '@/src/client/api'
import { useRefreshSettings } from './refreshContext'
import useModalDialogPrompt from './modalDialogContext'

export default function UserSettingsView() {
  const user = useLoggedInUser()

  return (
    <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
      <div className='text-base font-medium text-gray-800'>Settings</div>
      <ProviderSettingsPane user={user} />
    </div>
  )
}

function ProviderSettingsPane({ user }: { user: { availableProviders: AvailableProvider[] } }) {
  return (
    <>
      <Label>API Keys</Label>
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
        {AllProviders.filter(provider => provider !== DefaultProvider).map((provider, index) => (
          <ProviderRow key={index} availableProviders={user.availableProviders} provider={provider} />
        ))}
      </div>
    </>
  )
}

function ProviderRow({
  provider,
  availableProviders,
}: {
  provider: ModelProvider
  availableProviders: AvailableProvider[]
}) {
  const label = LabelForProvider(provider)
  const truncatedAPIKey = availableProviders.find(p => p.provider === provider)?.truncatedAPIKey ?? ''
  const haveAPIKey = truncatedAPIKey.length > 0

  const [showAPIKeyPrompt, setShowAPIKeyPrompt] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()
  const refreshSettings = useRefreshSettings()

  const updateKey = (apiKey: string | null) => {
    api.updateProviderKey(provider, apiKey).then(refreshSettings)
  }

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
