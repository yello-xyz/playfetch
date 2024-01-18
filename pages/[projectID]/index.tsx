import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import {
  User,
  ActiveProject,
  AvailableProvider,
  Workspace,
  PromptVersion,
  ChainVersion,
  Analytics,
  PromptConfig,
} from '@/types'
import ClientRoute, {
  CompareRoute,
  EndpointsRoute,
  ParseActiveItemQuery,
  ProjectRoute,
  ProjectSettingsRoute,
  WorkspaceRoute,
} from '@/src/common/clientRoute'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { ProjectContext } from '@/src/client/context/projectContext'
import { UserContext } from '@/src/client/context/userContext'
import { GlobalPopupContext, useGlobalPopupProvider } from '@/src/client/context/globalPopupContext'
import GlobalPopup from '@/components/globalPopup'
import usePrompt from '@/src/client/hooks/usePrompt'
import useChain from '@/src/client/hooks/useChain'
import { ActiveItem, CompareItem, EndpointsItem, SettingsItem } from '@/src/common/activeItem'
import loadActiveItem from '@/src/server/activeItem'
import useActiveItem from '@/src/client/hooks/useActiveItem'
import useCommentSelection from '@/src/client/hooks/useCommentSelection'
import { UserPresetsContext } from '@/src/client/context/userPresetsContext'
import { useDocumentationCookie } from '@/components/cookieBanner'
import { ProviderContext } from '@/src/client/context/providerContext'

import dynamic from 'next/dynamic'
import ProjectPaneWrapper from '@/components/projects/projectPaneWrapper'
import { UserPresets } from '@/src/common/userPresets'
import useTable from '@/src/client/hooks/useTable'

const MainProjectPane = dynamic(() => import('@/components/projects/mainProjectPane'))
const ProjectSidebar = dynamic(() => import('@/components/projects/projectSidebar'))
const ProjectTopBar = dynamic(() => import('@/components/projects/projectTopBar'))

export const getServerSideProps = withLoggedInSession(async ({ user, query }) => ({
  props: await loadActiveItem(user, query),
}))

export default function Home({
  user,
  workspaces,
  initialActiveProject,
  initialActiveItem,
  initialAnalytics,
  initialAvailableProviders,
  initialScopedProviders,
  initialUserPresets,
}: {
  user: User
  workspaces: Workspace[]
  initialActiveProject: ActiveProject
  initialActiveItem: ActiveItem | null
  initialAnalytics: Analytics | null
  initialAvailableProviders: AvailableProvider[]
  initialScopedProviders: AvailableProvider[]
  initialUserPresets: UserPresets
}) {
  useDocumentationCookie('set')
  const [
    activeProject,
    refreshProject,
    activeItem,
    setActiveItem,
    activePrompt,
    activeChain,
    activeTable,
    activeVersion,
    setActiveVersion,
    activePromptVersion,
    activeChainVersion,
  ] = useActiveItem(initialActiveProject, initialActiveItem)

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

  const [refreshTable, selectTable, addTable] = useTable(activeProject, refreshProject, activeTable, setActiveItem, savePrompt, () =>
    updateVersion(undefined)
  )

  const selectVersion = (version: PromptVersion | ChainVersion) => {
    if (activePrompt) {
      savePrompt(_ => refreshPrompt(activePrompt.id, version.id))
    }
    updateVersion(version)
  }

  const refreshActiveItem = (versionID?: number, allowResave?: boolean) => {
    if (activePrompt) {
      return refreshPrompt(activePrompt.id, versionID, allowResave)
    } else if (activeChain) {
      return refreshChain(activeChain.id, versionID)
    } else if (activeTable) {
      return refreshTable(activeTable.id)
    } else {
      return refreshProject()
    }
  }

  const savePromptCallback = () =>
    savePrompt(versionID => {
      refreshPrompt(activePrompt!.id, versionID)
      refreshProject()
    }).then(versionID => versionID!)

  const router = useRouter()
  const { promptID, chainID, tableID, compare, endpoints, settings } = ParseActiveItemQuery(router.query, activeProject)

  const onDeleteItem = async (itemID: number) => {
    refreshProject()
    if (itemID === activePrompt?.id || itemID === activeChain?.id) {
      setModifiedVersion(undefined)
      router.push(ProjectRoute(activeProject.id))
    }
  }

  const [analytics, setAnalytics] = useState(initialAnalytics ?? undefined)
  const refreshAnalytics = (dayRange?: number) => api.getAnalytics(activeProject.id, dayRange).then(setAnalytics)

  const [availableProviders, setAvailableProviders] = useState(initialAvailableProviders)
  const [scopedProviders, setScopedProviders] = useState(initialScopedProviders)
  const refreshProviders = () => {
    api.getScopedProviders(activeProject.id).then(setScopedProviders)
    api.getAvailableProviders(activeProject.id).then(setAvailableProviders)
  }

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

  const selectSettings = () => {
    savePrompt(refreshProject)
    setActiveItem(SettingsItem)
    updateVersion(undefined)
    if (!settings) {
      router.push(ProjectSettingsRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const currentQueryState = compare
    ? CompareItem
    : endpoints
    ? EndpointsItem
    : settings
    ? SettingsItem
    : promptID ?? chainID ?? tableID
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (compare) {
      selectCompare()
    } else if (endpoints) {
      selectEndpoints()
    } else if (settings) {
      selectSettings()
    } else if (promptID) {
      selectPrompt(promptID)
    } else if (chainID) {
      selectChain(chainID)
    } else if (tableID) {
      selectTable(tableID)
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

  const [focusRunID, selectComment] = useCommentSelection(activeVersion, async (parentID, versionID) => {
    const prompt = activeProject.prompts.find(prompt => prompt.id === parentID)
    const chain = activeProject.chains.find(chain => chain.id === parentID)
    if (prompt && prompt.id === activePrompt?.id) {
      return selectVersion(activePrompt.versions.find(version => version.id === versionID)!)
    } else if (prompt) {
      return selectPrompt(prompt.id, versionID)
    } else if (chain && chain.id === activeChain?.id) {
      return selectVersion(activeChain.versions.find(version => version.id === versionID)!)
    } else if (chain) {
      return selectChain(chain.id, versionID)
    }
  })

  const [currentUserPresets, setCurrentUserPresets] = useState(initialUserPresets)

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user }}>
        <ProviderContext.Provider value={{ availableProviders }}>
          <UserPresetsContext.Provider value={{ currentUserPresets, setCurrentUserPresets }}>
            <ProjectContext.Provider value={{ activeProject, refreshActiveItem, refreshProject }}>
              <ModalDialogContext.Provider value={{ setDialogPrompt }}>
                <GlobalPopupContext.Provider value={globalPopupProviderProps}>
                  <main className='flex flex-col h-screen text-sm'>
                    <ProjectPaneWrapper
                      topBar={toggleSidebarButton => (
                        <Suspense>
                          <ProjectTopBar
                            workspaces={workspaces}
                            onNavigateBack={navigateBack}
                            showComments={showComments}
                            setShowComments={setShowComments}>
                            {toggleSidebarButton}
                          </ProjectTopBar>
                        </Suspense>
                      )}
                      sidebar={rightBorder => (
                        <Suspense>
                          <ProjectSidebar
                            activeItem={activeItem}
                            workspaces={workspaces}
                            onAddPrompt={addPrompt}
                            onAddChain={addChain}
                            onAddTable={addTable}
                            onDeleteItem={onDeleteItem}
                            onSelectPrompt={selectPrompt}
                            onSelectChain={selectChain}
                            onSelectTable={selectTable}
                            onSelectCompare={selectCompare}
                            onSelectEndpoints={selectEndpoints}
                            onSelectSettings={selectSettings}
                            rightBorder={rightBorder}
                          />
                        </Suspense>
                      )}>
                      <div className='flex-1'>
                        <Suspense>
                          <MainProjectPane
                            activeItem={activeItem}
                            activePrompt={activePrompt}
                            activeChain={activeChain}
                            activeTable={activeTable}
                            activePromptVersion={activePromptVersion}
                            activeChainVersion={activeChainVersion}
                            selectVersion={selectVersion}
                            setModifiedVersion={setModifiedVersion}
                            addPrompt={addPrompt}
                            savePrompt={savePromptCallback}
                            saveChain={saveChain}
                            focusRunID={focusRunID}
                            analytics={analytics}
                            refreshAnalytics={refreshAnalytics}
                            scopedProviders={scopedProviders}
                            refreshProviders={refreshProviders}
                            showComments={showComments}
                            setShowComments={setShowComments}
                            selectComment={selectComment}
                          />
                        </Suspense>
                      </div>
                    </ProjectPaneWrapper>
                  </main>
                </GlobalPopupContext.Provider>
              </ModalDialogContext.Provider>
              <GlobalPopup {...globalPopupProps} {...popupProps} />
              <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
            </ProjectContext.Provider>
          </UserPresetsContext.Provider>
        </ProviderContext.Provider>
      </UserContext.Provider>
    </>
  )
}
