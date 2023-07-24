import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import { ActivePrompt, Version, User, ActiveProject, AvailableProvider, Workspace, Chain } from '@/types'
import ClientRoute, {
  ChainRoute,
  EndpointsRoute,
  ParseNumberQuery,
  ProjectRoute,
  PromptRoute,
  WorkspaceRoute,
} from '@/components/clientRoute'
import { getPromptVersionsForUser } from '@/src/server/datastore/prompts'
import { getActiveProject } from '@/src/server/datastore/projects'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { RefreshContext } from '@/components/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { UserContext } from '@/components/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import { VersionsEqual } from '@/src/common/versionsEqual'
import ProjectSidebar from '@/components/projectSidebar'
import EndpointsView from '@/components/endpointsView'
import { EmptyGridView } from '@/components/emptyGridView'
import { getWorkspacesForUser } from '@/src/server/datastore/workspaces'
import ProjectTopBar from '@/components/projectTopBar'

import dynamic from 'next/dynamic'
const PromptView = dynamic(() => import('@/components/promptView'))
const ChainView = dynamic(() => import('@/components/chainView'))

export const toActivePrompt = (promptID: number, versions: Version[], project: ActiveProject): ActivePrompt => ({
  ...project.prompts.find(prompt => prompt.id === promptID)!,
  versions,
  users: project.users,
  availableLabels: project.availableLabels,
})

const Endpoints = 'endpoints'
type ActiveItem = ActivePrompt | Chain | typeof Endpoints

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { projectID, p: promptID, c: chainID, e: endpoints } = ParseNumberQuery(query)

  const workspaces = await getWorkspacesForUser(user.id)

  const buildURL = urlBuilderFromHeaders(req.headers)
  const activeProject = await getActiveProject(user.id, projectID!, buildURL)

  const getActivePrompt = async (promptID: number): Promise<ActivePrompt | undefined> => {
    const versions = await getPromptVersionsForUser(user.id, promptID)
    return toActivePrompt(promptID, versions, activeProject)
  }

  let activeItem =
    endpoints === 1
      ? Endpoints
      : promptID
      ? await getActivePrompt(promptID)
      : chainID
      ? activeProject.chains.find(chain => chain.id === chainID)
      : activeProject.prompts.length > 0
      ? await getActivePrompt(activeProject.prompts[0].id)
      : undefined

  const availableProviders = await getAvailableProvidersForUser(user.id)

  return {
    props: {
      user,
      workspaces,
      initialActiveProject: activeProject,
      initialActiveItem: activeItem ?? null,
      availableProviders,
    },
  }
})

export default function Home({
  user,
  workspaces,
  initialActiveProject,
  initialActiveItem,
  availableProviders,
}: {
  user: User
  workspaces: Workspace[]
  initialActiveProject: ActiveProject
  initialActiveItem?: ActiveItem
  availableProviders: AvailableProvider[]
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [activeProject, setActiveProject] = useState(initialActiveProject)
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const isPrompt = (item: ActiveItem): item is ActivePrompt =>
    item !== Endpoints && 'lastVersionID' in (item as ActivePrompt)
  const isChain = (item: ActiveItem): item is Chain => item !== Endpoints && 'items' in (item as Chain)
  const activePrompt = activeItem && isPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && isChain(activeItem) ? activeItem : undefined
  const activeEndpoints = activeItem === Endpoints ? activeProject.endpoints : undefined

  const [showComments, setShowComments] = useState(false)

  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.slice(-1)?.[0])
  const [modifiedVersion, setModifiedVersion] = useState<Version>()

  const savePrompt = async (onSaved?: (versionID: number) => Promise<void>) => {
    const versionNeedsSaving =
      activePrompt && activeVersion && modifiedVersion && !VersionsEqual(activeVersion, modifiedVersion)
    setModifiedVersion(undefined)
    if (!versionNeedsSaving) {
      return activeVersion?.id
    }
    const equalPreviousVersion = activePrompt.versions.find(version => VersionsEqual(version, modifiedVersion))
    if (equalPreviousVersion) {
      setActiveVersion(equalPreviousVersion)
      return equalPreviousVersion.id
    }
    const versionID = await api.updatePrompt(
      activePrompt.id,
      modifiedVersion.prompt,
      modifiedVersion.config,
      activeVersion.id
    )
    await onSaved?.(versionID)
    return versionID
  }

  const updateVersion = (version?: Version) => {
    setActiveVersion(version)
    setModifiedVersion(undefined)
  }

  const selectVersion = (version: Version) => {
    if (activePrompt && activeVersion && version.id !== activeVersion.id) {
      savePrompt(_ => refreshPrompt(activePrompt.id, version.id))
      updateVersion(version)
    }
  }

  const refreshPrompt = async (promptID: number, focusVersionID = activeVersion?.id) => {
    const newVersions = await api.getPromptVersions(promptID)
    const newPrompt = toActivePrompt(promptID, newVersions, activeProject)
    setActiveItem(newPrompt)
    updateVersion(newPrompt.versions.find(version => version.id === focusVersionID) ?? newPrompt.versions.slice(-1)[0])
  }

  const refreshActivePrompt = activePrompt
    ? (versionID?: number) => refreshPrompt(activePrompt.id, versionID)
    : undefined

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      savePrompt()
      await refreshPrompt(promptID)
      router.push(PromptRoute(activeProject.id, promptID), undefined, { shallow: true })
    }
  }

  const refreshChain = async (chainID: number) => {
    const newChain = await api.getChain(chainID)
    setActiveItem(newChain)
    updateVersion(undefined)
  }

  const refreshActiveChain = activeChain ? () => refreshChain(activeChain.id) : undefined

  const selectChain = async (chainID: number) => {
    if (chainID !== activeChain?.id) {
      await refreshChain(chainID)
      router.push(ChainRoute(activeProject.id, chainID), undefined, { shallow: true })
    }
  }

  const selectEndpoints = () => {
    setActiveItem(Endpoints)
    updateVersion(undefined)
    router.push(EndpointsRoute(activeProject.id), undefined, { shallow: true })
  }

  const refreshProject = () => api.getProject(activeProject.id).then(setActiveProject)

  const refreshActiveItem = () => {
    refreshActivePrompt?.()
    refreshActiveChain?.()
    // Make sure active item is updated in sidebar too (and this will also update active endpoints).
    refreshProject()
  }

  const onDeleteItem = async () => {
    const newProject = await api.getProject(activeProject.id)
    setActiveProject(newProject)
    const promptID = newProject.prompts[0]?.id
    if (promptID) {
      selectPrompt(promptID)
    } else {
      setActiveItem(undefined)
      updateVersion(undefined)
      router.push(ProjectRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const { p: promptID, c: chainID, e: endpoints } = ParseNumberQuery(router.query)
  const currentQueryState = endpoints ? Endpoints : promptID ?? chainID ?? activeProject.prompts[0]?.id
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (endpoints) {
      selectEndpoints()
    } else if (promptID) {
      selectPrompt(promptID)
    } else if (chainID) {
      selectChain(chainID)
    } else if (activeProject.prompts.length > 0) {
      selectPrompt(activeProject.prompts[0].id)
    }
    setQuery(currentQueryState)
  }

  const addPrompt = async () => {
    const promptID = await api.addPrompt(activeProject.id)
    selectPrompt(promptID)
    refreshProject()
  }

  const addChain = async () => {
    const chainID = await api.addChain(activeProject.id)
    selectChain(chainID)
    refreshProject()
  }

  const selectSettings = () => router.push(ClientRoute.Settings, undefined, { shallow: true })

  const isSharedProject = !workspaces.find(workspace => workspace.id === activeProject.workspaceID)
  const navigateBack = () =>
    router.push(isSharedProject ? ClientRoute.SharedProjects : WorkspaceRoute(activeProject.workspaceID, user.id))

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <UserContext.Provider value={{ loggedInUser: user, availableProviders, showSettings: selectSettings }}>
          <RefreshContext.Provider value={{ refreshPrompt: refreshActivePrompt }}>
            <main className={`flex flex-col h-screen text-sm font-sans`}>
              <ProjectTopBar
                workspaces={workspaces}
                activeProject={activeProject}
                activeItem={activePrompt ?? activeChain}
                onRefreshProject={refreshProject}
                onNavigateBack={navigateBack}
                showComments={showComments}
                setShowComments={setShowComments}
              />
              <div className='flex items-stretch flex-1 overflow-hidden'>
                <ProjectSidebar
                  activeProject={activeProject}
                  activeItem={activeItem}
                  workspaces={workspaces}
                  onAddPrompt={addPrompt}
                  onAddChain={addChain}
                  onDeleteItem={onDeleteItem}
                  onRefreshItem={refreshActiveItem}
                  onSelectPrompt={selectPrompt}
                  onSelectChain={selectChain}
                  onSelectEndpoints={selectEndpoints}
                />
                <div className='flex-1'>
                  {activePrompt && activeVersion && (
                    <Suspense>
                      <PromptView
                        prompt={activePrompt}
                        project={activeProject}
                        activeVersion={activeVersion}
                        setActiveVersion={selectVersion}
                        setModifiedVersion={setModifiedVersion}
                        showComments={showComments}
                        setShowComments={setShowComments}
                        savePrompt={() => savePrompt(refreshActivePrompt).then(versionID => versionID!)}
                      />
                    </Suspense>
                  )}
                  {activeChain && (
                    <Suspense>
                      <ChainView
                        key={activeChain.id}
                        chain={activeChain}
                        project={activeProject}
                        onRefresh={refreshProject}
                      />
                    </Suspense>
                  )}
                  {activeEndpoints && <EndpointsView project={activeProject} onRefresh={refreshProject} />}
                  {!activeItem && <EmptyGridView title='No Prompts' addLabel='New Prompt' onAddItem={addPrompt} />}
                </div>
              </div>
            </main>
          </RefreshContext.Provider>
        </UserContext.Provider>
      </ModalDialogContext.Provider>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
