import { useLoggedInUser } from './userContext'
import Label from './label'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllProviders, LabelForProvider } from './modelSelector'
import { AvailableProvider, ModelProvider, User } from '@/types'
import TextInput from './textInput'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import api from '@/src/client/api'

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
  const truncatedAPIKey = availableProviders.find(p => p.provider === provider)?.truncatedAPIKey

  const [showAPIKeyPrompt, setShowAPIKeyPrompt] = useState(false)

  return (
    <div className='flex items-center justify-between gap-8'>
      <Label className='w-60'>{label}</Label>
      {truncatedAPIKey ?? (
        <div className='underline cursor-pointer' onClick={() => setShowAPIKeyPrompt(true)}>
          add key
        </div>
      )}
      {showAPIKeyPrompt && (
        <PickNameDialog
          title={`Link API Key`}
          confirmTitle='Save'
          label={label}
          onConfirm={apiKey => api.updateProviderKey(provider, apiKey)}
          onDismiss={() => setShowAPIKeyPrompt(false)}
        />
      )}
    </div>
  )
}
