import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { ActivePrompt, Version, User, ActiveProject, AvailableProvider, ActiveChain } from '@/types'
import PromptTabView, { MainViewTab } from '@/components/promptTabView'
import ClientRoute, { ChainRoute, ParseNumberQuery, ProjectRoute, PromptRoute, WorkspaceRoute } from '@/components/clientRoute'
import TopBar from '@/components/topBar'
import { getActivePrompt } from '@/src/server/datastore/prompts'
import { getActiveProject } from '@/src/server/datastore/projects'
import SegmentedControl, { Segment } from '@/components/segmentedControl'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { RefreshContext } from '@/components/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import ChainTabView from '@/components/chainTabView'
import { UserContext } from '@/components/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import { VersionsEqual } from '@/src/common/versionsEqual'
import { EmptyGridView } from '@/components/projectGridView'
import { getActiveChain } from '@/src/server/datastore/chains'
import ProjectSidebar from '@/components/projectSidebar'

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { projectID, p: promptID, c: chainID } = ParseNumberQuery(query)

  const buildURL = urlBuilderFromHeaders(req.headers)
  const initialActiveProject = await getActiveProject(user.id, projectID!, buildURL)
  const initialActiveItem = promptID
    ? await getActivePrompt(user.id, promptID, buildURL)
    : chainID
    ? await getActiveChain(user.id, chainID, buildURL)
    : initialActiveProject.prompts.length > 0
    ? await getActivePrompt(user.id, initialActiveProject.prompts[0].id, buildURL)
    : null

  const initialAvailableProviders = await getAvailableProvidersForUser(user.id)

  return {
    props: {
      user,
      initialActiveProject,
      initialActiveItem,
      initialAvailableProviders,
    },
  }
})

type ActiveItem = ActivePrompt | ActiveChain

export default function Home({
  user,
  initialActiveProject,
  initialActiveItem,
  initialAvailableProviders,
}: {
  user: User
  initialActiveProject: ActiveProject
  initialActiveItem?: ActiveItem
  initialAvailableProviders: AvailableProvider[]
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [activeProject, setActiveProject] = useState(initialActiveProject)
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const isPrompt = (item: ActiveItem): item is ActivePrompt => 'versions' in (item as ActivePrompt)
  const activePrompt = activeItem && isPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && !isPrompt(activeItem) ? activeItem : undefined

  const [showComments, setShowComments] = useState(false)

  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.slice(-1)?.[0])
  const [modifiedVersion, setModifiedVersion] = useState<Version>()

  const refreshProject = () => api.getProject(activeProject.id).then(setActiveProject)

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
    const newPrompt = await api.getPrompt(promptID)
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
  }

  const refreshActiveChain = activeChain ? () => refreshChain(activeChain.id) : undefined

  const selectChain = async (chainID: number) => {
    if (chainID !== activeChain?.id) {
      await refreshChain(chainID)
      router.push(ChainRoute(activeProject.id, chainID), undefined, { shallow: true })
    }
  }

  const [availableProviders, setAvailableProviders] = useState(initialAvailableProviders)
  const refreshSettings = () => api.getAvailableProviders().then(setAvailableProviders)

  const refreshActiveItem = () => (activePrompt ? refreshActivePrompt : refreshActiveChain)!()

  const { p: promptID, c: chainID } = ParseNumberQuery(router.query)
  const currentQueryState = promptID ?? chainID ?? activeProject.prompts[0]?.id
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (promptID) {
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
    setSelectedTab('play')
  }

  const addChain = async () => {
    const chainID = await api.addChain(activeProject.id)
    selectChain(chainID)
    setSelectedTab('play')
  }

  const [selectedTab, setSelectedTab] = useState<MainViewTab>('play')
  const updateSelectedTab = (tab: MainViewTab) => {
    if (activePrompt) {
      savePrompt(refreshActivePrompt)
    }
    setSelectedTab(tab)
  }

  const selectSettings = () => {
    router.push(ClientRoute.Settings, undefined, { shallow: true })
  }

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <UserContext.Provider value={{ loggedInUser: user, availableProviders, showSettings: selectSettings }}>
          <RefreshContext.Provider
            value={{
              refreshPrompt: refreshActivePrompt,
              refreshChain: refreshActiveChain,
              selectTab: setSelectedTab,
              refreshSettings,
            }}>
            <main className={`flex items-stretch h-screen text-sm font-sans`}>
              <ProjectSidebar
                activeProject={activeProject}
                activeItem={activeItem}
                onAddPrompt={addPrompt}
                onAddChain={addChain}
                onSelectPrompt={selectPrompt}
                onSelectChain={selectChain}
                onNavigateBack={() => router.push(WorkspaceRoute(activeProject.workspaceID, user.id))}
              />
              <div className='flex flex-col flex-1'>
                <TopBar
                  activeProject={activeProject}
                  activeItem={activePrompt ?? activeChain}
                  onRefreshItem={refreshActiveItem}
                  onDeleteItem={() => router.push(ProjectRoute(activeProject.id))}
                  onRefreshProject={refreshProject}
                  showComments={showComments}
                  setShowComments={setShowComments}>
                  {activeItem && (
                    <SegmentedControl selected={selectedTab} callback={updateSelectedTab}>
                      <Segment value={'play'} title='Play' />
                      <Segment value={'test'} title='Test' />
                      <Segment value={'publish'} title='Publish' />
                    </SegmentedControl>
                  )}
                </TopBar>
                <div className='flex-1 overflow-hidden'>
                  {activePrompt && activeVersion && (
                    <PromptTabView
                      activeTab={selectedTab}
                      prompt={activePrompt}
                      activeVersion={activeVersion}
                      setActiveVersion={selectVersion}
                      setModifiedVersion={setModifiedVersion}
                      showComments={showComments}
                      setShowComments={setShowComments}
                      savePrompt={() => savePrompt(refreshActivePrompt).then(versionID => versionID!)}
                    />
                  )}
                  {activeChain && <ChainTabView activeTab={selectedTab} chain={activeChain} />}
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
