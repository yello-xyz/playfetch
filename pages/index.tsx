import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { User, AvailableProvider, Workspace, ActiveWorkspace } from '@/types'
import ClientRoute, { ParseNumberQuery, ProjectRoute, WorkspaceRoute } from '@/components/clientRoute'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { UserContext } from '@/components/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/userSettingsView'
import { getActiveWorkspace, getWorkspacesForUser } from '@/src/server/datastore/workspaces'
import PickNameDialog from '@/components/pickNameDialog'
import WorkspaceGridView from '@/components/workspaceGridView'
import WorkspaceSidebar from '@/components/workspaceSidebar'

export const getServerSideProps = withLoggedInSession(async ({ query, user }) => {
  const { w: workspaceID, s: settings } = ParseNumberQuery(query)

  const initialWorkspaces = await getWorkspacesForUser(user.id)
  const initialActiveWorkspace = await getActiveWorkspace(user.id, workspaceID ?? user.id)

  const initialAvailableProviders = await getAvailableProvidersForUser(user.id)
  const initialShowSettings = settings === 1

  return {
    props: {
      user,
      initialWorkspaces,
      initialActiveWorkspace,
      initialAvailableProviders,
      initialShowSettings,
    },
  }
})

export default function Home({
  user,
  initialWorkspaces,
  initialActiveWorkspace,
  initialAvailableProviders,
  initialShowSettings,
}: {
  user: User
  initialWorkspaces: Workspace[]
  initialActiveWorkspace: ActiveWorkspace
  initialAvailableProviders: AvailableProvider[]
  initialShowSettings: boolean
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const [workspaces, setWorkspaces] = useState(initialWorkspaces)

  const [activeWorkspace, setActiveWorkspace] = useState(initialActiveWorkspace)

  const [showSettings, setShowSettings] = useState(initialShowSettings)

  const refreshWorkspace = (workspaceID: number) => api.getWorkspace(workspaceID).then(setActiveWorkspace)

  const selectWorkspace = async (workspaceID: number) => {
    if (workspaceID !== activeWorkspace.id || showSettings) {
      await refreshWorkspace(workspaceID)
      router.push(WorkspaceRoute(workspaceID === user.id ? undefined : workspaceID), undefined, { shallow: true })
    }
    setShowSettings(false)
  }

  const navigateToProject = async (projectID: number) => {
    router.push(ProjectRoute(projectID))
  }

  const addProject = async (name: string) => {
    const projectID = await api.addProject(activeWorkspace.id, name)
    navigateToProject(projectID)
  }

  const [availableProviders, setAvailableProviders] = useState(initialAvailableProviders)
  const refreshSettings = () => api.getAvailableProviders().then(setAvailableProviders)

  const selectSettings = () => {
    setShowSettings(true)
    router.push(ClientRoute.Settings, undefined, { shallow: true })
  }

  const refreshWorkspaces = () => api.getWorkspaces().then(setWorkspaces)

  const { w: workspaceID, s: settings } = ParseNumberQuery(router.query)
  const currentQueryState = settings ? 'settings' : workspaceID
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (settings) {
      selectSettings()
    } else {
      selectWorkspace(workspaceID ?? user.id)
    }
    setQuery(currentQueryState)
  }

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <UserContext.Provider value={{ loggedInUser: user, availableProviders, showSettings: selectSettings }}>
          <main className={`flex items-stretch h-screen text-sm font-sans`}>
            <WorkspaceSidebar
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={selectWorkspace}
              onAddProject={() => setShowPickNamePrompt(true)}
              onRefreshWorkspaces={refreshWorkspaces}
            />
            <div className='flex flex-col flex-1'>
              <div className='flex-1 overflow-hidden'>
                {showSettings ? (
                  <UserSettingsView />
                ) : (
                  <WorkspaceGridView
                    workspaces={workspaces}
                    activeWorkspace={activeWorkspace}
                    onAddProject={() => setShowPickNamePrompt(true)}
                    onSelectProject={navigateToProject}
                    onRefreshWorkspace={() => refreshWorkspace(activeWorkspace.id)}
                  />
                )}
              </div>
            </div>
          </main>
        </UserContext.Provider>
      </ModalDialogContext.Provider>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add a new project'
          confirmTitle='Add'
          label='Project name'
          onConfirm={addProject}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
