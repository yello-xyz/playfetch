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
  ChainItem,
  LogEntry,
  InputValues,
  Prompt,
  ActiveChain,
  PromptVersion,
  RawPromptVersion,
  RawChainVersion,
  Chain,
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
import { IsPromptChainItem } from '@/components/chainNode'
import { getLogEntriesForProject } from '@/src/server/datastore/logs'
import { getChainForUser } from '@/src/server/datastore/chains'
import { GlobalPopupContext, GlobalPopupLocation, GlobalPopupRender } from '@/components/globalPopupContext'
import GlobalPopup from '@/components/globalPopup'
const PromptView = dynamic(() => import('@/components/promptView'))
const ChainView = dynamic(() => import('@/components/chainView'))
const EndpointsView = dynamic(() => import('@/components/endpointsView'))

export const toActivePrompt = (
  prompt: Prompt,
  versions: RawPromptVersion[],
  inputValues: InputValues,
  project: ActiveProject
): ActivePrompt => {
  const versionIDsUsedInChains = {} as { [versionID: number]: string }
  project.chains.forEach(chain =>
    (chain.items as ChainItem[]).filter(IsPromptChainItem).forEach(item => {
      versionIDsUsedInChains[item.versionID] = chain.name
    })
  )

  const versionIDsUsedAsEndpoints = project.endpoints
    .map(endpoint => endpoint.versionID)
    .filter(versionID => !!versionID)

  return {
    ...prompt,
    versions: versions.map(version => ({
      ...version,
      usedInChain: versionIDsUsedInChains[version.id] ?? null,
      usedAsEndpoint: versionIDsUsedAsEndpoints.includes(version.id),
    })),
    inputValues,
    users: project.users,
    availableLabels: project.availableLabels,
  }
}

export const toActiveChain = (
  chain: Chain,
  versions: RawChainVersion[],
  inputValues: InputValues,
  project: ActiveProject
): ActiveChain => {
  const versionIDsUsedAsEndpoints = project.endpoints
    .map(endpoint => endpoint.versionID)
    .filter(versionID => !!versionID)

  return {
    ...chain,
    versions: versions.map(version => ({
      ...version,
      usedAsEndpoint: versionIDsUsedAsEndpoints.includes(version.id),
    })),
    inputValues,
    users: project.users,
    availableLabels: project.availableLabels,
  }
}

const Endpoints = 'endpoints'
type ActiveItem = ActivePrompt | ActiveChain | typeof Endpoints

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { projectID, p: promptID, c: chainID, e: endpoints } = ParseNumberQuery(query)

  const workspaces = await getWorkspacesForUser(user.id)

  const buildURL = urlBuilderFromHeaders(req.headers)
  const activeProject = await getActiveProject(user.id, projectID!, buildURL)

  const getActivePrompt = async (promptID: number): Promise<ActivePrompt> => {
    const { prompt, versions, inputValues } = await getPromptForUser(user.id, promptID)
    return toActivePrompt(prompt, versions, inputValues, activeProject)
  }

  const getActiveChain = async (chainID: number): Promise<ActiveChain> => {
    const { chain, versions, inputValues } = await getChainForUser(user.id, chainID)
    return toActiveChain(chain, versions, inputValues, activeProject)
  }

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
  const isPrompt = (item: ActiveItem): item is ActivePrompt => item !== Endpoints && 'lastVersionID' in item
  const isChain = (item: ActiveItem): item is ActiveChain => item !== Endpoints && 'items' in item
  const activePrompt = activeItem && isPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && isChain(activeItem) ? activeItem : undefined

  const activeEndpoints = activeItem === Endpoints ? activeProject.endpoints : undefined
  const [logEntries, setLogEntries] = useState(initialLogEntries ?? undefined)

  const [showComments, setShowComments] = useState(false)

  const [activeVersion, setActiveVersion] = useState<PromptVersion | undefined>(activePrompt?.versions?.slice(-1)?.[0])
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activeVersion, setActiveVersion)

  const updateVersion = (version?: PromptVersion) => {
    setActiveVersion(version)
    setModifiedVersion(undefined)
  }

  const selectVersion = (version: PromptVersion) => {
    if (activePrompt && activeVersion && version.id !== activeVersion.id) {
      savePrompt(_ => refreshPrompt(activePrompt.id, version.id))
      updateVersion(version)
    }
  }

  const refreshPrompt = async (promptID: number, focusVersionID = activeVersion?.id) => {
    const { prompt, versions, inputValues } = await api.getPrompt(promptID)
    const newPrompt = toActivePrompt(prompt, versions, inputValues, activeProject)
    setActiveItem(newPrompt)
    updateVersion(newPrompt.versions.find(version => version.id === focusVersionID) ?? newPrompt.versions.slice(-1)[0])
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

  const refreshChain = async (chainID: number) => {
    const { chain, versions, inputValues } = await api.getChain(chainID)
    const newChain = toActiveChain(chain, versions, inputValues, activeProject)
    setActiveItem(newChain)
    updateVersion(undefined)
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
            <RefreshContext.Provider value={{ refreshPrompt: refreshActivePrompt }}>
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
                          savePrompt={() => savePrompt(refreshActiveItem).then(versionID => versionID!)}
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
