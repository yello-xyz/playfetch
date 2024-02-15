import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import {
  User,
  Workspace,
  ActiveWorkspace,
  Project,
  PendingWorkspace,
  IsPendingWorkspace,
  PendingProject,
} from '@/types'
import ClientRoute, {
  ParseNumberQuery,
  ProjectRoute,
  Redirect,
  SharedProjectsWorkspaceID,
  WorkspaceRoute,
} from '@/src/common/clientRoute'
import ModalDialog, { DialogPrompt } from '@/src/client/components/modalDialog'
import { ModalDialogContext } from '@/src/client/components/modalDialogContext'
import { UserContext } from '@/src/client/users/userContext'
import { getActiveWorkspace, getWorkspacesForUser } from '@/src/server/datastore/workspaces'
import { getSharedProjectsForUser } from '@/src/server/datastore/projects'
import { GlobalPopupContext, useGlobalPopupProvider } from '@/src/client/components/globalPopupContext'
import GlobalPopup from '@/src/client/components/globalPopup'
import { useDocumentationCookie } from '@/src/client/cookies/cookieBanner'

import dynamic from 'next/dynamic'
const WorkspaceSidebar = dynamic(() => import('@/src/client/workspaces/workspaceSidebar'))
const WorkspaceInvite = dynamic(() => import('@/src/client/workspaces/workspaceInvite'))
const WorkspaceGridView = dynamic(() => import('@/src/client/workspaces/workspaceGridView'))

const IsSharedProjects = (workspace: ActiveWorkspace) => workspace.id === SharedProjectsWorkspaceID
export const SharedProjectsWorkspace = (
  projects: Project[],
  pendingProjects: PendingProject[] = []
): ActiveWorkspace => ({
  id: SharedProjectsWorkspaceID,
  name: 'Shared Projects',
  projects: [...pendingProjects, ...projects],
  users: [],
  pendingUsers: [],
})

export const getServerSideProps = withLoggedInSession(async ({ query, user }) => {
  if (!user.didCompleteOnboarding) {
    return Redirect(ClientRoute.Onboarding)
  }

  const { w: workspaceID } = ParseNumberQuery(query)

  const [initialWorkspaces, initialPendingWorkspaces] = await getWorkspacesForUser(user.id)

  const [projects, pendingProjects] = await getSharedProjectsForUser(user.id, initialWorkspaces)
  const initialSharedProjects =
    projects.length > 0 || pendingProjects.length > 0 ? SharedProjectsWorkspace(projects, pendingProjects) : null
  const initialActiveWorkspace =
    workspaceID === SharedProjectsWorkspaceID
      ? initialSharedProjects ?? (await getActiveWorkspace(user.id, user.id))
      : initialPendingWorkspaces.find(workspace => workspace.id === workspaceID) ??
        (await getActiveWorkspace(user.id, workspaceID ?? user.id))

  return {
    props: {
      user,
      initialSharedProjects,
      initialWorkspaces,
      initialPendingWorkspaces,
      initialActiveWorkspace,
    },
  }
})

export default function Home({
  user,
  initialSharedProjects,
  initialWorkspaces,
  initialPendingWorkspaces,
  initialActiveWorkspace,
}: {
  user: User
  initialSharedProjects?: ActiveWorkspace
  initialWorkspaces: Workspace[]
  initialPendingWorkspaces: PendingWorkspace[]
  initialActiveWorkspace: ActiveWorkspace | PendingWorkspace
}) {
  useDocumentationCookie('set')
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [workspaces, setWorkspaces] = useState(initialWorkspaces)
  const [pendingWorkspaces, setPendingWorkspaces] = useState(initialPendingWorkspaces)
  const [sharedProjects, setSharedProjects] = useState(initialSharedProjects)

  const [activeWorkspace, setActiveWorkspace] = useState(initialActiveWorkspace)

  const refreshWorkspace = (workspaceID: number) =>
    workspaceID === SharedProjectsWorkspaceID
      ? api.getSharedProjects().then(([projects, pendingProjects]) => {
          if (projects.length > 0 || pendingProjects.length > 0) {
            setActiveWorkspace(SharedProjectsWorkspace(projects, pendingProjects))
          } else {
            selectWorkspace(user.id)
            setSharedProjects(undefined)
          }
        })
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

  const respondToWorkspaceInvite = (workspaceID: number, accept: boolean) =>
    api.respondToInvite(workspaceID, accept).then(() => {
      if (accept) {
        refreshWorkspace(workspaceID)
      } else {
        selectWorkspace(user.id)
        refreshWorkspaces()
      }
    })

  const respondToProjectInvite = (projectID: number, accept: boolean) =>
    api.respondToInvite(projectID, accept).then(() => {
      if (accept) {
        navigateToProject(projectID)
      } else {
        refreshWorkspace(activeWorkspace.id)
      }
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
      <UserContext.Provider value={{ loggedInUser: user }}>
        <ModalDialogContext.Provider value={{ setDialogPrompt }}>
          <GlobalPopupContext.Provider value={globalPopupProviderProps}>
            <main className='flex items-stretch h-screen text-sm'>
              <Suspense>
                <WorkspaceSidebar
                  workspaces={workspaces}
                  pendingWorkspaces={pendingWorkspaces}
                  activeWorkspaceID={activeWorkspace.id}
                  sharedProjects={sharedProjects}
                  onSelectWorkspace={selectWorkspace}
                  onSelectSharedProjects={() => selectWorkspace(SharedProjectsWorkspaceID)}
                  onRefreshWorkspace={() => refreshWorkspace(activeWorkspace.id)}
                  onRefreshWorkspaces={refreshWorkspaces}
                />
              </Suspense>
              <div className='flex flex-col flex-1'>
                <div className='flex-1 overflow-hidden'>
                  {IsPendingWorkspace(activeWorkspace) ? (
                    <Suspense>
                      <WorkspaceInvite
                        workspace={activeWorkspace}
                        onRespond={accept => respondToWorkspaceInvite(activeWorkspace.id, accept)}
                      />
                    </Suspense>
                  ) : (
                    <Suspense>
                      <WorkspaceGridView
                        workspaces={workspaces}
                        activeWorkspace={activeWorkspace}
                        isUserWorkspace={activeWorkspace.id === user.id}
                        isSharedProjects={IsSharedProjects(activeWorkspace)}
                        onRespondToProjectInvite={respondToProjectInvite}
                        onAddProject={addProject}
                        onSelectProject={navigateToProject}
                        onSelectUserWorkspace={() => selectWorkspace(user.id)}
                        onRefreshWorkspace={() => refreshWorkspace(activeWorkspace.id)}
                        onRefreshWorkspaces={refreshWorkspaces}
                      />
                    </Suspense>
                  )}
                </div>
              </div>
            </main>
          </GlobalPopupContext.Provider>
        </ModalDialogContext.Provider>
        <GlobalPopup {...globalPopupProps} {...popupProps} />
        <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
      </UserContext.Provider>
    </>
  )
}
