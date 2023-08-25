import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import {
  ActivePrompt,
  User,
  ActiveProject,
  AvailableProvider,
  Workspace,
  LogEntry,
  ActiveChain,
  PromptVersion,
  ChainVersion,
} from '@/types'
import ClientRoute, {
  ChainRoute,
  EndpointsRoute,
  ParseNumberQuery,
  ProjectRoute,
  PromptRoute,
  WorkspaceRoute,
} from '@/components/clientRoute'
import { getPromptForUser } from '@/src/server/datastore/prompts'
import { getActiveProject } from '@/src/server/datastore/projects'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { RefreshContext } from '@/components/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { UserContext } from '@/components/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import ProjectSidebar from '@/components/projectSidebar'
import { EmptyGridView } from '@/components/emptyGridView'
import { getWorkspacesForUser } from '@/src/server/datastore/workspaces'
import ProjectTopBar from '@/components/projectTopBar'
import useSavePrompt from '@/components/useSavePrompt'

import dynamic from 'next/dynamic'
import { getLogEntriesForProject } from '@/src/server/datastore/logs'
import { getChainForUser } from '@/src/server/datastore/chains'
import { GlobalPopupContext, GlobalPopupLocation, GlobalPopupRender } from '@/components/globalPopupContext'
import GlobalPopup from '@/components/globalPopup'
import { BuildActiveChain, BuildActivePrompt } from '@/src/common/activeItem'
import useSaveChain from '@/components/useSaveChain'
const PromptView = dynamic(() => import('@/components/promptView'))
const ChainView = dynamic(() => import('@/components/chainView'))
const EndpointsView = dynamic(() => import('@/components/endpointsView'))

const Endpoints = 'endpoints'
type ActiveItem = ActivePrompt | ActiveChain | typeof Endpoints

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { projectID, p: promptID, c: chainID, e: endpoints } = ParseNumberQuery(query)

  const workspaces = await getWorkspacesForUser(user.id)

  const buildURL = urlBuilderFromHeaders(req.headers)
  const activeProject = await getActiveProject(user.id, projectID!, buildURL)

  const getActivePrompt = async (promptID: number): Promise<ActivePrompt> =>
    getPromptForUser(user.id, promptID).then(BuildActivePrompt(activeProject))

  const getActiveChain = async (chainID: number): Promise<ActiveChain> =>
    await getChainForUser(user.id, chainID).then(BuildActiveChain(activeProject))

  const initialActiveItem: ActiveItem | null =
    endpoints === 1
      ? Endpoints
      : promptID
      ? await getActivePrompt(promptID)
      : chainID
      ? await getActiveChain(chainID)
      : activeProject.prompts.length > 0
      ? await getActivePrompt(activeProject.prompts[0].id)
      : null

  const initialLogEntries = initialActiveItem === Endpoints ? await getLogEntriesForProject(user.id, projectID!) : null
  const availableProviders = await getAvailableProvidersForUser(user.id)

  return {
    props: {
      user,
      workspaces,
      initialActiveProject: activeProject,
      initialActiveItem,
      initialLogEntries,
      availableProviders,
    },
  }
})

export default function Home({
  user,
  workspaces,
  initialActiveProject,
  initialActiveItem,
  initialLogEntries,
  availableProviders,
}: {
  user: User
  workspaces: Workspace[]
  initialActiveProject: ActiveProject
  initialActiveItem: ActiveItem | null
  initialLogEntries: LogEntry[] | null
  availableProviders: AvailableProvider[]
}) {
  const router = useRouter()

  const [activeProject, setActiveProject] = useState(initialActiveProject)

  const [activeItem, setActiveItem] = useState(initialActiveItem ?? undefined)
  const isChain = (item: ActiveItem): item is ActiveChain => item !== Endpoints && 'referencedItemIDs' in item
  const isPrompt = (item: ActiveItem): item is ActivePrompt => item !== Endpoints && !isChain(item)
  const activePrompt = activeItem && isPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && isChain(activeItem) ? activeItem : undefined

  const activeEndpoints = activeItem === Endpoints ? activeProject.endpoints : undefined
  const [logEntries, setLogEntries] = useState(initialLogEntries ?? undefined)

  const [showComments, setShowComments] = useState(false)

  const [activePromptVersion, setActivePromptVersion] = useState<PromptVersion | undefined>(
    activePrompt?.versions?.slice(-1)?.[0]
  )
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activePromptVersion, setActivePromptVersion)

  const updatePromptVersion = (version?: PromptVersion) => {
    setActivePromptVersion(version)
    setModifiedVersion(undefined)
  }

  const selectPromptVersion = (version: PromptVersion) => {
    if (activePrompt && activePromptVersion && version.id !== activePromptVersion.id) {
      savePrompt(_ => refreshPrompt(activePrompt.id, version.id))
      updatePromptVersion(version)
    }
  }

  const refreshPrompt = async (promptID: number, focusVersionID = activePromptVersion?.id) => {
    const newPrompt = await api.getPrompt(promptID, activeProject)
    setActiveItem(newPrompt)
    updatePromptVersion(
      newPrompt.versions.find(version => version.id === focusVersionID) ?? newPrompt.versions.slice(-1)[0]
    )
    setActiveChainVersion(undefined)
  }

  const refreshActivePrompt = activePrompt
    ? (versionID?: number) => refreshPrompt(activePrompt.id, versionID)
    : undefined

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      savePrompt(refreshProject)
      await refreshPrompt(promptID)
      router.push(PromptRoute(activeProject.id, promptID), undefined, { shallow: true })
    }
  }

  const [activeChainVersion, setActiveChainVersion] = useState<ChainVersion | undefined>(
    activeChain?.versions?.slice(-1)?.[0]
  )
  const saveChain = useSaveChain(activeChain, activeChainVersion, setActiveChainVersion)

  const refreshChain = async (chainID: number, focusVersionID = activePromptVersion?.id) => {
    const newChain = await api.getChain(chainID, activeProject)
    setActiveItem(newChain)
    setActiveChainVersion(
      newChain.versions.find(version => version.id === focusVersionID) ?? newChain.versions.slice(-1)[0]
    )
    updatePromptVersion(undefined)
  }

  const refreshActiveChain = activeChain ? () => refreshChain(activeChain.id) : undefined

  const selectChain = async (chainID: number) => {
    if (chainID !== activeChain?.id) {
      savePrompt(refreshProject)
      await refreshChain(chainID)
      router.push(ChainRoute(activeProject.id, chainID), undefined, { shallow: true })
    }
  }

  const selectEndpoints = () => {
    savePrompt(refreshProject)
    setActiveItem(Endpoints)
    if (!logEntries) {
      api.getLogEntries(activeProject.id).then(setLogEntries)
    }
    updatePromptVersion(undefined)
    setActiveChainVersion(undefined)
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
      updatePromptVersion(undefined)
      setActiveChainVersion(undefined)
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
    refreshProject().then(() => selectPrompt(promptID))
  }

  const addChain = async () => {
    const chainID = await api.addChain(activeProject.id)
    refreshProject().then(() => selectChain(chainID))
  }

  const selectSettings = () => {
    savePrompt()
    router.push(ClientRoute.Settings, undefined, { shallow: true })
  }

  const isSharedProject = !workspaces.find(workspace => workspace.id === activeProject.workspaceID)
  const navigateBack = () => {
    savePrompt()
    router.push(isSharedProject ? ClientRoute.SharedProjects : WorkspaceRoute(activeProject.workspaceID, user.id))
  }

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [popupRender, setPopupRender] = useState<GlobalPopupRender<any>>()
  const [popupProps, setPopupProps] = useState<any>()
  const [popupLocation, setPopupLocation] = useState<GlobalPopupLocation>({})

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <GlobalPopupContext.Provider
          value={{
            setPopupRender: render => setPopupRender(() => render),
            setPopupProps,
            setPopupLocation,
          }}>
          <UserContext.Provider value={{ loggedInUser: user, availableProviders, showSettings: selectSettings }}>
            <RefreshContext.Provider value={{ refreshActiveItem: refreshActivePrompt ?? refreshActiveChain }}>
              <main className='flex flex-col h-screen text-sm'>
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
                    {activePrompt && activePromptVersion && (
                      <Suspense>
                        <PromptView
                          prompt={activePrompt}
                          project={activeProject}
                          activeVersion={activePromptVersion}
                          setActiveVersion={selectPromptVersion}
                          setModifiedVersion={setModifiedVersion}
                          showComments={showComments}
                          setShowComments={setShowComments}
                          savePrompt={() => savePrompt(refreshActiveItem).then(versionID => versionID!)}
                        />
                      </Suspense>
                    )}
                    {activeChain && activeChainVersion && (
                      <Suspense>
                        <ChainView
                          key={activeChain.id}
                          chain={activeChain}
                          activeVersion={activeChainVersion}
                          setActiveVersion={setActiveChainVersion}
                          project={activeProject}
                          saveChain={saveChain}
                        />
                      </Suspense>
                    )}
                    {activeEndpoints && (
                      <Suspense>
                        <EndpointsView project={activeProject} logEntries={logEntries} onRefresh={refreshProject} />
                      </Suspense>
                    )}
                    {!activeItem && <EmptyGridView title='No Prompts' addLabel='New Prompt' onAddItem={addPrompt} />}
                  </div>
                </div>
              </main>
            </RefreshContext.Provider>
          </UserContext.Provider>
        </GlobalPopupContext.Provider>
      </ModalDialogContext.Provider>
      <GlobalPopup
        {...popupProps}
        location={popupLocation}
        onDismiss={() => setPopupRender(undefined)}
        render={popupRender}
      />
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
