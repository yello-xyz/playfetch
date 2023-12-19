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
import { useActiveProject, useRefreshProject } from '@/src/client/context/projectContext'

export default function GitHubSettings({
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
      title: 'Are you sure you want to reset your GitHub integration?',
      callback: () => updateEnvironment(),
      destructive: true,
    })
  }

  const isProviderAvailable = scopedProvider && !isUpdating
  const isProjectScope = scope === 'project'

  const refreshProject = useRefreshProject()
  const activeProject = useActiveProject()

  const importPrompts = async () => {
    setDialogPrompt({
      title: 'Import prompts to project?',
      content:
        'This will look for compatible YAML files in the GitHub repository and import them in the project, either as new prompts, or as new versions of previously imported & exported prompts if changes are detected.',
      callback: async () => {
        setProcessing(true)
        await api.importPrompts(scopeID).then(refreshProject)
        setProcessing(false)
      },
    })
  }

  const exportPrompts = async () => {
    setDialogPrompt({
      title: 'Export prompts to repository?',
      content:
        'This will export the most recent version of any prompts that were previously imported or manually exported through the version menu and modified since.',
      callback: async () => {
        setProcessing(true)
        await api.exportPrompts(scopeID)
        setProcessing(false)
      },
    })
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
                    placeholder='path to prompts directory'
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
            <Link href={process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_LINK ?? ''}>
              <div className='px-4 py-2 font-medium border border-gray-200 rounded-lg hover:bg-gray-100'>
                {scopedProvider ? 'Update' : 'Install'}
              </div>
            </Link>
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
        <div className='flex items-center gap-2'>
          <Button type='outline' disabled={isProcessing} onClick={importPrompts}>
            Import Prompts
          </Button>
          <Button
            type='outline'
            disabled={isProcessing || !activeProject.prompts.some(prompt => prompt.sourcePath !== null)}
            onClick={exportPrompts}>
            Export Prompts
          </Button>
        </div>
      )}
    </>
  )
}
