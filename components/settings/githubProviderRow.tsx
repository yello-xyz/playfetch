import { LabelForProvider } from '@/src/common/providerMetadata'
import { AvailableProvider, IsModelProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import Button from '../button'
import TextInput from '../textInput'
import { ProviderRow } from './providerSettings'

export default function GitHubProviderRow({
  scope,
  scopeID,
  availableProvider,
  onRefresh,
}: {
  scope: 'user' | 'project'
  scopeID: number
  availableProvider?: AvailableProvider
  onRefresh: () => void
}) {
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

  const installGithubApp = () => api.getGithubAppInstallLink(scopeID).then(link => window.open(link, '_self'))

  const updateKey = async (apiKey: string | null) => {
    setProcessing(true)
    await api.updateProviderKey(scopeID, 'github', apiKey, environment).then(onRefresh)
    setProcessing(false)
    toggleUpdate(false)
  }

  const setDialogPrompt = useModalDialogPrompt()
  const removeKey = () => {
    setDialogPrompt({
      title: `Are you sure you want to unlink your ${LabelForProvider(
        'github'
      )} API key? This may affect published endpoints.`,
      callback: () => updateKey(null),
      destructive: true,
    })
  }

  const isProviderAvailable = availableProvider && !isUpdating
  const isProjectScope = scope === 'project'

  return (
    <ProviderRow
      provider='github'
      flexLayout={(availableProvider && isProjectScope) || isUpdating ? 'flex-col' : 'justify-between'}>
      {isProjectScope ? (
        <div className='flex items-center gap-2.5'>
          {isProviderAvailable && <>{previousEnvironment && <TextInput disabled value={previousEnvironment} />}</>}
          {isUpdating && (
            <TextInput
              disabled={isProcessing}
              value={environment ?? ''}
              setValue={setEnvironment}
              placeholder='Environment'
            />
          )}
          <div className='flex gap-2.5 justify-end grow cursor-pointer'>
            {isUpdating && (
              <Button
                type='primary'
                disabled={!apiKey.length || !environment?.length || isProcessing}
                onClick={() => updateKey(apiKey)}>
                {availableProvider ? 'Update' : 'Add'}
              </Button>
            )}
            <Button type='outline' onClick={installGithubApp}>
              {availableProvider ? 'Reinstall' : 'Install'}
            </Button>
            {isProviderAvailable && (
              <Button type='destructive' disabled={isProcessing} onClick={removeKey}>
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button type='outline' onClick={installGithubApp}>
          {availableProvider ? 'Reinstall' : 'Install'}
        </Button>
      )}
    </ProviderRow>
  )
}
