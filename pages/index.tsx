import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { User, AvailableProvider, Workspace, ActiveWorkspace, Project } from '@/types'
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
import { getSharedProjectsForUser } from '@/src/server/datastore/projects'

const SharedProjectsWorkspaceID = 1
const IsSharedProjects = (workspace: ActiveWorkspace) => workspace.id === SharedProjectsWorkspaceID
const SharedProjectsWorkspace = (projects: Project[]): ActiveWorkspace => ({
  id: SharedProjectsWorkspaceID,
  name: 'Shared Projects',
  projects,
  users: [],
})

const ShouldActivateSharedProjects = (workspaceID: number, workspaces: Workspace[], sharedProjects: Project[]) =>
  workspaceID === SharedProjectsWorkspaceID ||
  (sharedProjects.some(project => project.workspaceID === workspaceID) &&
    !workspaces.some(workspace => workspace.id === workspaceID))

export const getServerSideProps = withLoggedInSession(async ({ query, user }) => {
  const { w: workspaceID, s: settings } = ParseNumberQuery(query)

  const initialWorkspaces = await getWorkspacesForUser(user.id)

  const projects = await getSharedProjectsForUser(user.id)
  const sharedProjects = projects.length > 0 ? SharedProjectsWorkspace(projects) : null
  const initialActiveWorkspace =
    workspaceID && ShouldActivateSharedProjects(workspaceID, initialWorkspaces, projects)
      ? sharedProjects
      : await getActiveWorkspace(user.id, workspaceID ?? user.id)

  const availableProviders = await getAvailableProvidersForUser(user.id)
  const initialShowSettings = settings === 1

  return {
    props: {
      user,
      sharedProjects,
      initialWorkspaces,
      initialActiveWorkspace,
      availableProviders,
      initialShowSettings,
    },
  }
})

export default function Home({
  user,
  sharedProjects,
  initialWorkspaces,
  initialActiveWorkspace,
  availableProviders,
  initialShowSettings,
}: {
  user: User
  sharedProjects?: ActiveWorkspace
  initialWorkspaces: Workspace[]
  initialActiveWorkspace: ActiveWorkspace
  availableProviders: AvailableProvider[]
  initialShowSettings: boolean
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const [workspaces, setWorkspaces] = useState(initialWorkspaces)

  const [activeWorkspace, setActiveWorkspace] = useState(initialActiveWorkspace)

  const [showSettings, setShowSettings] = useState(initialShowSettings)

  const refreshWorkspace = (workspaceID: number) =>
    ShouldActivateSharedProjects(workspaceID, workspaces, sharedProjects?.projects ?? [])
      ? api.getSharedProjects().then(projects => setActiveWorkspace(SharedProjectsWorkspace(projects)))
      : api.getWorkspace(workspaceID).then(setActiveWorkspace)

  const selectWorkspace = async (workspaceID: number) => {
    if (workspaceID !== activeWorkspace.id || showSettings) {
      await refreshWorkspace(workspaceID)
      router.push(WorkspaceRoute(workspaceID, user.id), undefined, { shallow: true })
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

  const selectSettings = () => {
    setShowSettings(true)
    router.push(ClientRoute.Settings, undefined, { shallow: true })
  }

  const refreshWorkspaces = () => api.getWorkspaces().then(setWorkspaces)

  const onLeftLastSharedProject = () => {
    selectWorkspace(user.id)
    refreshWorkspaces()
  }

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
              sharedProjects={sharedProjects}
              onSelectWorkspace={selectWorkspace}
              onSelectSharedProjects={() => selectWorkspace(SharedProjectsWorkspaceID)}
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
                    isSharedProjects={IsSharedProjects(activeWorkspace)}
                    onAddProject={() => setShowPickNamePrompt(true)}
                    onSelectProject={navigateToProject}
                    onRefreshWorkspace={() => refreshWorkspace(activeWorkspace.id)}
                    onLeftLastSharedProject={onLeftLastSharedProject}
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
