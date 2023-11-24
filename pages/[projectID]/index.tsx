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
  SettingsRoute,
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
import { PromptConfigContext } from '@/src/client/context/promptConfigContext'
import { useDocumentationCookie } from '@/components/cookieBanner'
import { ProviderContext } from '@/src/client/context/providerContext'

import dynamic from 'next/dynamic'
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
  initialPromptConfig,
}: {
  user: User
  workspaces: Workspace[]
  initialActiveProject: ActiveProject
  initialActiveItem: ActiveItem | null
  initialAnalytics: Analytics | null
  initialAvailableProviders: AvailableProvider[]
  initialScopedProviders: AvailableProvider[]
  initialPromptConfig: PromptConfig
}) {
  useDocumentationCookie('set')
  const [
    activeProject,
    refreshProject,
    activeItem,
    setActiveItem,
    activePrompt,
    activeChain,
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
  const { promptID, chainID, compare, endpoints, settings } = ParseActiveItemQuery(router.query, activeProject)

  const onDeleteItem = async (itemID: number) => {
    refreshProject()
    if (itemID === activePrompt?.id || itemID === activeChain?.id) {
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
      router.push(SettingsRoute(activeProject.id), undefined, { shallow: true })
    }
  }

  const currentQueryState = compare
    ? CompareItem
    : endpoints
      ? EndpointsItem
      : settings
        ? SettingsItem
        : promptID ?? chainID
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

  const [activeRunID, selectComment] = useCommentSelection(activeVersion, async (parentID, versionID) => {
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

  const [defaultPromptConfig, setDefaultPromptConfig] = useState(initialPromptConfig)

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user }}>
        <ProviderContext.Provider value={{ availableProviders }}>
          <PromptConfigContext.Provider value={{ defaultPromptConfig, setDefaultPromptConfig }}>
            <ProjectContext.Provider value={{ refreshActiveItem, refreshProject }}>
              <ModalDialogContext.Provider value={{ setDialogPrompt }}>
                <GlobalPopupContext.Provider value={globalPopupProviderProps}>
                  <main className='flex flex-col h-screen text-sm'>
                    <Suspense>
                      <ProjectTopBar
                        workspaces={workspaces}
                        activeProject={activeProject}
                        onRefreshProject={refreshProject}
                        onNavigateBack={navigateBack}
                        showComments={showComments}
                        setShowComments={setShowComments}
                      />
                    </Suspense>
                    <div className='flex items-stretch flex-1 overflow-hidden'>
                      <Suspense>
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
                          onSelectSettings={selectSettings}
                        />
                      </Suspense>
                      <div className='flex-1'>
                        <Suspense>
                          <MainProjectPane
                            activeProject={activeProject}
                            refreshProject={refreshProject}
                            activeItem={activeItem}
                            activePrompt={activePrompt}
                            activeChain={activeChain}
                            activePromptVersion={activePromptVersion}
                            activeChainVersion={activeChainVersion}
                            selectVersion={selectVersion}
                            setModifiedVersion={setModifiedVersion}
                            addPrompt={addPrompt}
                            savePrompt={savePrompt}
                            saveChain={saveChain}
                            refreshOnSavePrompt={refreshOnSavePrompt}
                            activeRunID={activeRunID}
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
                    </div>
                  </main>
                </GlobalPopupContext.Provider>
              </ModalDialogContext.Provider>
              <GlobalPopup {...globalPopupProps} {...popupProps} />
              <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
            </ProjectContext.Provider>
          </PromptConfigContext.Provider>
        </ProviderContext.Provider>
      </UserContext.Provider>
    </>
  )
}
