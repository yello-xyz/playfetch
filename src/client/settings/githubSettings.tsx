import { ActiveProject, AvailableProvider, AvailableSourceControlProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import Button from '@/src/client/components/button'
import TextInput from '@/src/client/components/textInput'
import { useSourceControlProvider } from '@/src/client/settings/providerContext'
import Link from 'next/link'
import DropdownMenu from '@/src/client/components/dropdownMenu'
import { useRefreshProject } from '@/src/client/projects/projectContext'
import { useLoggedInUser } from '@/src/client/users/userContext'
import AppSettings from './appSettings'

export default function GitHubSettings({
  activeProject,
  scopeID,
  provider,
  onRefresh,
}: {
  activeProject?: ActiveProject
  scopeID: number
  provider?: AvailableProvider
  onRefresh: () => void
}) {
  const user = useLoggedInUser()
  const availableProvider = useSourceControlProvider()
  const userProvider = availableProvider?.scopeID === user.id ? availableProvider : undefined
  const scopedProvider = provider as AvailableSourceControlProvider | undefined

  const repositories: string[] = userProvider ? JSON.parse(userProvider.environment) : []
  const scopedPath = scopedProvider?.environment ?? ''
  const scopedRepository = scopedPath.split('/').slice(0, 2).join('/')
  const scopedRootDirectory = scopedPath.split('/').slice(2).join('/')

  const [repository, setRepository] = useState(scopedRepository || repositories[0])
  const [rootDirectory, setRootDirectory] = useState(scopedRootDirectory)

  const refreshProject = useRefreshProject()

  const [isProcessing, setProcessing] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()
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
      <AppSettings
        provider='github'
        activeProject={activeProject}
        scopeID={scopeID}
        scopedProvider={scopedProvider}
        availableProvider={availableProvider}
        onRefresh={onRefresh}
        getEnvironment={() => `${repository}/${rootDirectory}`}
        userConfiguration={() => (
          <Link href={process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_LINK ?? ''}>
            <div className='px-4 py-2 font-medium border border-gray-200 rounded-lg hover:bg-gray-100'>
              {scopedProvider ? 'Update' : 'Install'}
            </div>
          </Link>
        )}
        projectConfiguration={(isConfigured, isUpdating, isProcessing, confirmButton) => (
          <div className='flex items-center gap-2.5 w-full'>
            {isConfigured && <TextInput disabled value={scopedPath} />}
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
            {confirmButton()}
          </div>
        )}
      />
      {activeProject && scopedProvider && (
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
