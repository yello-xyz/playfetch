import { AvailableProvider, AvailableSourceControlProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import Button from '../button'
import TextInput from '../textInput'
import { ProviderRow } from './providerSettings'
import { useSourceControlProvider } from '@/src/client/context/providerContext'
import Link from 'next/link'
import { UserSettingsRoute } from '@/src/common/clientRoute'
import DropdownMenu from '../dropdownMenu'
import { TryParseJSON } from '@/src/common/formatting'

export default function GitHubProviderRow({
  scope,
  scopeID,
  provider,
  onRefresh,
}: {
  scope: 'user' | 'project'
  scopeID: number
  provider?: AvailableProvider
  onRefresh: () => void
}) {
  const scopedProvider = provider as AvailableSourceControlProvider | undefined
  const availableProvider = useSourceControlProvider()

  const repositories: string[] = TryParseJSON(availableProvider?.environment ?? '') ?? []
  const scopedPath = scopedProvider?.environment ?? ''
  const scopedRepository = scopedPath.split('/').slice(0, 2).join('/')
  const scopedRootDirectory = scopedPath.split('/').slice(2).join('/')

  const [repository, setRepository] = useState(scopedRepository || repositories[0])
  const [rootDirectory, setRootDirectory] = useState(scopedRootDirectory)

  const [isUpdating, setUpdating] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  const updateEnvironment = async (environment?: string) => {
    setProcessing(true)
    await api.updateProviderKey(scopeID, 'github', null, environment).then(onRefresh)
    setProcessing(false)
    setUpdating(false)
  }

  const setDialogPrompt = useModalDialogPrompt()
  const resetEnvironment = () => {
    setDialogPrompt({
      title: `Are you sure you want to reset your GitHub integration?`,
      callback: () => updateEnvironment(),
      destructive: true,
    })
  }

  const installApp = () => api.installGithubApp().then(link => window.open(link, '_self'))

  const isProviderAvailable = scopedProvider && !isUpdating
  const isProjectScope = scope === 'project'

  const importPrompts = async () => {
    setProcessing(true)
    await api.importPrompts(scopeID).then(onRefresh)
    setProcessing(false)
  }

  return (
    <>
      {!isProjectScope || availableProvider ? (
        <ProviderRow
          provider='github'
          flexLayout={(scopedProvider && isProjectScope) || isUpdating ? 'flex-col' : 'justify-between'}>
          {isProjectScope ? (
            <div className='flex items-center gap-2.5'>
              {isProviderAvailable && <TextInput disabled value={scopedPath} />}
              {isUpdating && (
                <>
                  <DropdownMenu value={repository} onChange={setRepository}>
                    {repositories.map((repo, index) => (
                      <option key={index} value={repo}>
                        {repo}
                      </option>
                    ))}
                  </DropdownMenu>
                  {'/'}
                  <TextInput
                    disabled={isProcessing}
                    value={rootDirectory}
                    setValue={setRootDirectory}
                    placeholder='root directory'
                  />
                </>
              )}
              <div className='flex gap-2.5 justify-end grow cursor-pointer'>
                {isUpdating ? (
                  <Button
                    type='primary'
                    disabled={isProcessing}
                    onClick={() => updateEnvironment(`${repository}/${rootDirectory}`)}>
                    Confirm
                  </Button>
                ) : scopedProvider ? (
                  <Button type='destructive' disabled={isProcessing} onClick={resetEnvironment}>
                    Reset
                  </Button>
                ) : (
                  <Button type='outline' onClick={() => setUpdating(!isUpdating)}>
                    Configure
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button type='outline' onClick={installApp}>
              {scopedProvider ? 'Refresh' : 'Install'}
            </Button>
          )}
        </ProviderRow>
      ) : (
        <div>
          Start by installing the GitHub App in your{' '}
          <Link href={UserSettingsRoute('sourceControl')} className='underline'>
            Account Settings
          </Link>
          .
        </div>
      )}
      {isProjectScope && scopedProvider && (
        <Button type='outline' disabled={isProcessing} onClick={importPrompts}>
          Import Prompts
        </Button>
      )}
    </>
  )
}
