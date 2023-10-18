import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { User, AvailableProvider, Workspace, ActiveWorkspace, Project, PendingWorkspace, IsPendingWorkspace } from '@/types'
import { ParseNumberQuery, ProjectRoute, SharedProjectsWorkspaceID, WorkspaceRoute } from '@/src/client/clientRoute'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import { getActiveWorkspace, getWorkspacesForUser } from '@/src/server/datastore/workspaces'
import WorkspaceGridView from '@/components/workspaces/workspaceGridView'
import WorkspaceSidebar from '@/components/workspaces/workspaceSidebar'
import { getSharedProjectsForUser } from '@/src/server/datastore/projects'
import { GlobalPopupContext, useGlobalPopupProvider } from '@/src/client/context/globalPopupContext'
import GlobalPopup from '@/components/globalPopup'
import WorkspaceInvite from '@/components/workspaces/workspaceInvite'

const IsSharedProjects = (workspace: ActiveWorkspace) => workspace.id === SharedProjectsWorkspaceID
export const SharedProjectsWorkspace = (projects: Project[]): ActiveWorkspace => ({
  id: SharedProjectsWorkspaceID,
  name: 'Shared Projects',
  projects,
  users: [],
})

export const getServerSideProps = withLoggedInSession(async ({ query, user }) => {
  const { w: workspaceID } = ParseNumberQuery(query)

  const [initialWorkspaces, initialPendingWorkspaces] = await getWorkspacesForUser(user.id)

  const projects = await getSharedProjectsForUser(user.id)
  const sharedProjects = projects.length > 0 ? SharedProjectsWorkspace(projects) : null
  const initialActiveWorkspace =
    workspaceID === SharedProjectsWorkspaceID
      ? sharedProjects
      : initialPendingWorkspaces.find(workspace => workspace.id === workspaceID) ??
        (await getActiveWorkspace(user.id, workspaceID ?? user.id))

  const availableProviders = await getAvailableProvidersForUser(user.id)

  return {
    props: {
      user,
      sharedProjects,
      initialWorkspaces,
      initialPendingWorkspaces,
      initialActiveWorkspace,
      availableProviders,
    },
  }
})

export default function Home({
  user,
  sharedProjects,
  initialWorkspaces,
  initialPendingWorkspaces,
  initialActiveWorkspace,
  availableProviders,
}: {
  user: User
  sharedProjects?: ActiveWorkspace
  initialWorkspaces: Workspace[]
  initialPendingWorkspaces: PendingWorkspace[]
  initialActiveWorkspace: ActiveWorkspace | PendingWorkspace
  availableProviders: AvailableProvider[]
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [workspaces, setWorkspaces] = useState(initialWorkspaces)
  const [pendingWorkspaces, setPendingWorkspaces] = useState(initialPendingWorkspaces)

  const [activeWorkspace, setActiveWorkspace] = useState(initialActiveWorkspace)

  const refreshWorkspace = (workspaceID: number) =>
    workspaceID === SharedProjectsWorkspaceID
      ? api.getSharedProjects().then(projects => setActiveWorkspace(SharedProjectsWorkspace(projects)))
      : api.getWorkspace(workspaceID).then(setActiveWorkspace)

  const selectWorkspace = async (workspaceID: number) => {
    if (workspaceID !== activeWorkspace.id) {
      const pendingWorkspace = pendingWorkspaces.find(workspace => workspace.id === workspaceID)
      if (pendingWorkspace) {
        setActiveWorkspace(pendingWorkspace)
      } else {
        await refreshWorkspace(workspaceID)
      }
      router.push(WorkspaceRoute(workspaceID, user.id), undefined, { shallow: true })
    }
  }

  const navigateToProject = (projectID: number) => router.push(ProjectRoute(projectID))

  const addProject = async () => {
    const projectID = await api.addProject(activeWorkspace.id)
    await navigateToProject(projectID)
  }

  const refreshWorkspaces = () =>
    api.getWorkspaces().then(([workspaces, pendingWorkspaces]) => {
      setWorkspaces(workspaces)
      setPendingWorkspaces(pendingWorkspaces)
    })

  const { w: workspaceID } = ParseNumberQuery(router.query)
  const currentQueryState = workspaceID
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    selectWorkspace(workspaceID ?? user.id)
    setQuery(currentQueryState)
  }

  const [globalPopupProviderProps, globalPopupProps, popupProps] = useGlobalPopupProvider<any>()

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <GlobalPopupContext.Provider value={globalPopupProviderProps}>
          <UserContext.Provider value={{ loggedInUser: user, availableProviders }}>
            <main className='flex items-stretch h-screen text-sm'>
              <WorkspaceSidebar
                workspaces={workspaces}
                pendingWorkspaces={pendingWorkspaces}
                activeWorkspaceID={activeWorkspace.id}
                sharedProjects={sharedProjects}
                onSelectWorkspace={selectWorkspace}
                onSelectSharedProjects={() => selectWorkspace(SharedProjectsWorkspaceID)}
                onRefreshWorkspaces={refreshWorkspaces}
              />
              <div className='flex flex-col flex-1'>
                <div className='flex-1 overflow-hidden'>
                  {IsPendingWorkspace(activeWorkspace) ? (
                    <WorkspaceInvite workspace={activeWorkspace} />
                  ) : (
                    <WorkspaceGridView
                      workspaces={workspaces}
                      activeWorkspace={activeWorkspace}
                      isUserWorkspace={activeWorkspace.id === user.id}
                      isSharedProjects={IsSharedProjects(activeWorkspace)}
                      onAddProject={addProject}
                      onSelectProject={navigateToProject}
                      onSelectUserWorkspace={() => selectWorkspace(user.id)}
                      onRefreshWorkspace={() => refreshWorkspace(activeWorkspace.id)}
                      onRefreshWorkspaces={refreshWorkspaces}
                    />
                  )}
                </div>
              </div>
            </main>
          </UserContext.Provider>
        </GlobalPopupContext.Provider>
      </ModalDialogContext.Provider>
      <GlobalPopup {...globalPopupProps} {...popupProps} />
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
