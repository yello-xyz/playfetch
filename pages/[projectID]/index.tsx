import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import { User, ActiveProject, AvailableProvider, Workspace, PromptVersion, ChainVersion, Analytics } from '@/types'
import ClientRoute, {
  CompareRoute,
  EndpointsRoute,
  ParseActiveItemQuery,
  ProjectRoute,
  WorkspaceRoute,
} from '@/src/common/clientRoute'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { RefreshContext } from '@/src/client/context/refreshContext'
import { UserContext } from '@/src/client/context/userContext'
import ProjectSidebar from '@/components/projects/projectSidebar'
import ProjectTopBar from '@/components/projects/projectTopBar'
import { GlobalPopupContext, useGlobalPopupProvider } from '@/src/client/context/globalPopupContext'
import GlobalPopup from '@/components/globalPopup'
import usePrompt from '@/src/client/hooks/usePrompt'
import useChain from '@/src/client/hooks/useChain'
import { EmptyProjectView } from '@/components/projects/emptyProjectView'
import { ActiveItem, CompareItem, EndpointsItem } from '@/src/common/activeItem'
import loadActiveItem from '@/src/server/activeItem'
import useActiveItem, { useActiveVersion } from '@/src/client/hooks/useActiveItem'

import dynamic from 'next/dynamic'
const PromptView = dynamic(() => import('@/components/prompts/promptView'))
const ChainView = dynamic(() => import('@/components/chains/chainView'))
const EndpointsView = dynamic(() => import('@/components/endpoints/endpointsView'))
const CompareView = dynamic(() => import('@/components/compare/compareView'))

export const getServerSideProps = withLoggedInSession(async ({ user, query }) => ({
  props: await loadActiveItem(user, query),
}))

export default function Home({
  user,
  workspaces,
  initialActiveProject,
  initialActiveItem,
  initialAnalytics,
  availableProviders,
}: {
  user: User
  workspaces: Workspace[]
  initialActiveProject: ActiveProject
  initialActiveItem: ActiveItem | null
  initialAnalytics: Analytics | null
  availableProviders: AvailableProvider[]
}) {
  const [activeProject, refreshProject, activeItem, setActiveItem, activePrompt, activeChain] = useActiveItem(
    initialActiveProject,
    initialActiveItem
  )
  const [activeVersion, setActiveVersion, activePromptVersion, activeChainVersion] = useActiveVersion(activeItem)

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

  const refreshOnSavePrompt = (promptID: number) => (versionID?: number) => {
    refreshPrompt(promptID, versionID)
    refreshProject()
  }

  const router = useRouter()
  const { promptID, chainID, compare, endpoints } = ParseActiveItemQuery(router.query, activeProject)

  const onDeleteItem = async (itemID: number) => {
    refreshProject()
    if (itemID === activePrompt?.id || itemID === activeChain?.id) {
      router.push(ProjectRoute(activeProject.id))
    }
  }

  const [analytics, setAnalytics] = useState(initialAnalytics ?? undefined)
  const refreshAnalytics = (dayRange?: number) => api.getAnalytics(activeProject.id, dayRange).then(setAnalytics)

  const selectCompare = () => {
    savePrompt(refreshProject)
    setActiveItem(CompareItem)
    updateVersion(undefined)
    if (!analytics) {
      refreshAnalytics()
    }
    if (!compare) {
      router.push(CompareRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const selectEndpoints = () => {
    savePrompt(refreshProject)
    setActiveItem(EndpointsItem)
    updateVersion(undefined)
    if (!analytics) {
      refreshAnalytics()
    }
    if (!endpoints) {
      router.push(EndpointsRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const currentQueryState = compare ? CompareItem : endpoints ? EndpointsItem : promptID ?? chainID
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
                          savePrompt={() =>
                            savePrompt(refreshOnSavePrompt(activePrompt.id)).then(versionID => versionID!)
                          }
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
                    {activeItem === CompareItem && (
                      <Suspense>
                        <CompareView project={activeProject} logEntries={analytics?.recentLogEntries} />
                      </Suspense>
                    )}
                    {activeItem === EndpointsItem && (
                      <Suspense>
                        <EndpointsView
                          project={activeProject}
                          analytics={analytics}
                          refreshAnalytics={refreshAnalytics}
                          onRefresh={refreshProject}
                        />
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
