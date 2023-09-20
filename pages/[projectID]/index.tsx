import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import {
  User,
  ActiveProject,
  AvailableProvider,
  Workspace,
  LogEntry,
  PromptVersion,
  ChainVersion,
  IsPromptVersion,
} from '@/types'
import ClientRoute, {
  CompareRoute,
  EndpointsRoute,
  ParseNumberQuery,
  ProjectRoute,
  WorkspaceRoute,
} from '@/src/client/clientRoute'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { RefreshContext } from '@/src/client/context/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { UserContext } from '@/src/client/context/userContext'
import ProjectSidebar from '@/components/projects/projectSidebar'
import ProjectTopBar from '@/components/projects/projectTopBar'
import { GlobalPopupContext, useGlobalPopupProvider } from '@/src/client/context/globalPopupContext'
import GlobalPopup from '@/components/globalPopup'
import usePrompt from '@/src/client/hooks/usePrompt'
import useChain from '@/src/client/hooks/useChain'
import { EmptyProjectView } from '@/components/projects/emptyProjectView'
import { ActiveItem, ActiveItemIsChain, ActiveItemIsPrompt, CompareItem, EndpointsItem } from '@/src/common/activeItem'
import loadActiveItem from '@/src/server/activeItem'

import dynamic from 'next/dynamic'
const PromptView = dynamic(() => import('@/components/prompts/promptView'))
const ChainView = dynamic(() => import('@/components/chains/chainView'))
const EndpointsView = dynamic(() => import('@/components/endpoints/endpointsView'))

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { projectID, p: promptID, c: chainID, m: compare, e: endpoints } = ParseNumberQuery(query)
  const buildURL = urlBuilderFromHeaders(req.headers)
  return { props: await loadActiveItem(user, projectID!, promptID, chainID, compare === 1, endpoints === 1, buildURL) }
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
  const refreshProject = () => api.getProject(activeProject.id).then(setActiveProject)

  const [activeItem, setActiveItem] = useState(initialActiveItem ?? undefined)
  const activePrompt = activeItem && ActiveItemIsPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && ActiveItemIsChain(activeItem) ? activeItem : undefined

  const [activeVersion, setActiveVersion] = useState<PromptVersion | ChainVersion | undefined>(
    activeItem === CompareItem || activeItem === EndpointsItem ? undefined : activeItem?.versions?.slice(-1)?.[0]
  )
  const activePromptVersion = activeVersion && IsPromptVersion(activeVersion) ? activeVersion : undefined
  const activeChainVersion = activeVersion && !IsPromptVersion(activeVersion) ? activeVersion : undefined

  const [refreshPrompt, selectPrompt, addPrompt, savePrompt, setModifiedVersion] = usePrompt(
    activeProject,
    refreshProject,
    activePrompt,
    setActiveItem,
    activePromptVersion,
    setActiveVersion
  )

  const [refreshChain, selectChain, addChain, saveChain] = useChain(
    activeProject,
    refreshProject,
    activeChain,
    setActiveItem,
    activeChainVersion,
    setActiveVersion,
    savePrompt
  )

  const updateVersion = (version?: PromptVersion | ChainVersion) => {
    setActiveVersion(version)
    setModifiedVersion(undefined)
  }

  const selectVersion = (version: PromptVersion | ChainVersion) => {
    if (version.id !== activeVersion?.id) {
      if (activePrompt) {
        savePrompt(_ => refreshPrompt(activePrompt.id, version.id))
      }
      updateVersion(version)
    }
  }

  const refreshActiveItem = (versionID?: number) => {
    if (activePrompt) {
      return refreshPrompt(activePrompt.id, versionID)
    } else if (activeChain) {
      return refreshChain(activeChain.id, versionID)
    } else {
      return refreshProject()
    }
  }

  const refresh = (versionID?: number) => {
    refreshActiveItem(versionID)
    if (activeItem !== CompareItem && activeItem !== EndpointsItem) {
      refreshProject()
    }
  }

  const onDeleteItem = async () => {
    const newProject = await api.getProject(activeProject.id)
    setActiveProject(newProject)
    if (
      (activePrompt && !newProject.prompts.find(prompt => prompt.id === activePrompt.id)) ||
      (activeChain && !newProject.chains.find(chain => chain.id === activeChain.id))
    ) {
      const promptID = newProject.prompts[0]?.id
      if (promptID) {
        selectPrompt(promptID)
      } else {
        setActiveItem(undefined)
        updateVersion(undefined)
        router.push(ProjectRoute(activeProject.id), undefined, { shallow: true })
      }
    }
  }

  const { p: promptID, c: chainID, m: compare, e: endpoints } = ParseNumberQuery(router.query)

  const selectCompare = () => {
    savePrompt(refreshProject)
    setActiveItem(CompareItem)
    updateVersion(undefined)
    if (!compare) {
      router.push(CompareRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const [logEntries, setLogEntries] = useState(initialLogEntries ?? undefined)
  const selectEndpoints = () => {
    savePrompt(refreshProject)
    setActiveItem(EndpointsItem)
    updateVersion(undefined)
    if (!logEntries) {
      api.getLogEntries(activeProject.id).then(setLogEntries)
    }
    if (!endpoints) {
      router.push(EndpointsRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const currentQueryState = compare
    ? CompareItem
    : endpoints
    ? EndpointsItem
    : promptID ?? chainID ?? activeProject.prompts[0]?.id
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (compare) {
      selectCompare()
    } else if (endpoints) {
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

  const isSharedProject = !workspaces.find(workspace => workspace.id === activeProject.workspaceID)
  const navigateBack = () => {
    savePrompt()
    router.push(isSharedProject ? ClientRoute.SharedProjects : WorkspaceRoute(activeProject.workspaceID, user.id))
  }

  const [showComments, setShowComments] = useState(false)
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [globalPopupProviderProps, globalPopupProps, popupProps] = useGlobalPopupProvider<any>()

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user, availableProviders }}>
        <RefreshContext.Provider value={{ refreshActiveItem, refreshProject }}>
          <ModalDialogContext.Provider value={{ setDialogPrompt }}>
            <GlobalPopupContext.Provider value={globalPopupProviderProps}>
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
                    onRefreshItem={() => refresh()}
                    onSelectPrompt={selectPrompt}
                    onSelectChain={selectChain}
                    onSelectCompare={selectCompare}
                    onSelectEndpoints={selectEndpoints}
                  />
                  <div className='flex-1'>
                    {activePrompt && activePromptVersion && (
                      <Suspense>
                        <PromptView
                          prompt={activePrompt}
                          activeVersion={activePromptVersion}
                          setActiveVersion={selectVersion}
                          setModifiedVersion={setModifiedVersion}
                          showComments={showComments}
                          setShowComments={setShowComments}
                          savePrompt={() => savePrompt(refresh).then(versionID => versionID!)}
                        />
                      </Suspense>
                    )}
                    {activeChain && activeChainVersion && (
                      <Suspense>
                        <ChainView
                          key={activeChain.id}
                          chain={activeChain}
                          activeVersion={activeChainVersion}
                          setActiveVersion={selectVersion}
                          project={activeProject}
                          showComments={showComments}
                          setShowComments={setShowComments}
                          saveChain={saveChain}
                        />
                      </Suspense>
                    )}
                    {activeItem === EndpointsItem && (
                      <Suspense>
                        <EndpointsView project={activeProject} logEntries={logEntries} onRefresh={refreshProject} />
                      </Suspense>
                    )}
                    {!activeItem && <EmptyProjectView onAddPrompt={addPrompt} />}
                  </div>
                </div>
              </main>
            </GlobalPopupContext.Provider>
          </ModalDialogContext.Provider>
          <GlobalPopup {...globalPopupProps} {...popupProps} />
          <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
        </RefreshContext.Provider>
      </UserContext.Provider>
    </>
  )
}
