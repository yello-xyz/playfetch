import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { Project, ActivePrompt, Version, User, ActiveProject, AvailableProvider, ActiveChain } from '@/types'
import Sidebar from '@/components/sidebar'
import PromptTabView, { MainViewTab } from '@/components/promptTabView'
import ClientRoute, { ChainRoute, ChainsRoute, ParseQuery, ProjectRoute, PromptRoute } from '@/components/clientRoute'
import TopBar from '@/components/topBar'
import { getActivePrompt } from '@/src/server/datastore/prompts'
import { getActiveProject, getProjectsForUser } from '@/src/server/datastore/projects'
import SegmentedControl, { Segment } from '@/components/segmentedControl'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { RefreshContext } from '@/components/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import ChainTabView from '@/components/chainTabView'
import { UserContext } from '@/components/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/userSettingsView'
import { VersionsEqual } from '@/src/common/versionsEqual'
import ProjectGridView, { EmptyGridView } from '@/components/projectGridView'
import { getActiveChain } from '@/src/server/datastore/chains'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const {
    g: projectID,
    p: promptID,
    c: chainID,
    s: settings,
    cs: chains,
  } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(user.id)
  const buildURL = urlBuilderFromHeaders(req.headers)
  const initialActiveItem = promptID
    ? await getActivePrompt(user.id, promptID, buildURL)
    : chainID
    ? await getActiveChain(user.id, chainID, buildURL)
    : await getActiveProject(user.id, projectID ?? user.id, buildURL)

  const initialAvailableProviders = await getAvailableProvidersForUser(user.id)
  const initialShowSettings = settings === 1
  const initialShowChains = chains === 1

  return {
    props: {
      user,
      initialProjects,
      initialActiveItem,
      initialAvailableProviders,
      initialShowSettings,
      initialShowChains,
    },
  }
})

type ActiveItem = ActiveProject | ActivePrompt | ActiveChain

export default function Home({
  user,
  initialProjects,
  initialActiveItem,
  initialAvailableProviders,
  initialShowSettings,
  initialShowChains,
}: {
  user: User
  initialProjects: Project[]
  initialActiveItem: ActiveItem
  initialAvailableProviders: AvailableProvider[]
  initialShowSettings: boolean
  initialShowChains: boolean
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [projects, setProjects] = useState(initialProjects)

  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const isProject = (item: ActiveItem): item is ActiveProject => 'chains' in (item as ActiveProject)
  const isPrompt = (item: ActiveItem): item is ActivePrompt => 'versions' in (item as ActivePrompt)
  const activeProject = isProject(activeItem) ? activeItem : undefined
  const activePrompt = isPrompt(activeItem) ? activeItem : undefined
  const activeChain = !isProject(activeItem) && !isPrompt(activeItem) ? activeItem : undefined

  const [isChainMode, setChainMode] = useState(initialShowChains)
  const [showSettings, setShowSettings] = useState(initialShowSettings)
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
      router.push(PromptRoute(promptID), undefined, { shallow: true })
    }
    setChainMode(false)
    setShowSettings(false)
  }

  const refreshChain = async (chainID: number) => {
    const newChain = await api.getChain(chainID)
    setActiveItem(newChain)
  }

  const refreshActiveChain = activeChain ? () => refreshChain(activeChain.id) : undefined

  const selectChain = async (chainID: number) => {
    if (chainID !== activeChain?.id) {
      await refreshChain(chainID)
      router.push(ChainRoute(chainID), undefined, { shallow: true })
    }
    setChainMode(false)
    setShowSettings(false)
  }

  const refreshProject = async (projectID: number) => {
    const newProject = await api.getProject(projectID)
    setActiveItem(newProject)
    updateVersion(undefined)
  }

  const refreshActiveProject = activeProject ? () => refreshProject(activeProject.id) : undefined

  const selectProject = async (projectID: number, chainMode = false) => {
    if (projectID !== activeProject?.id || chainMode !== isChainMode || showSettings) {
      savePrompt()
      await refreshProject(projectID)
      router.push(
        chainMode ? ChainsRoute(projectID) : projectID === user.id ? ClientRoute.Home : ProjectRoute(projectID),
        undefined,
        { shallow: true }
      )
    }
    setChainMode(chainMode)
    setShowSettings(false)
  }

  const selectChains = () => {
    const activePromptProject = activePrompt && projects.find(project => project.id === activePrompt.projectID)
    const activeChainProject = activeChain && projects.find(project => project.id === activeChain.projectID)
    const project = activeProject ?? activePromptProject ?? (activeChainProject as Project)
    selectProject(project.id, true)
  }

  const [availableProviders, setAvailableProviders] = useState(initialAvailableProviders)
  const refreshSettings = () => api.getAvailableProviders().then(setAvailableProviders)

  const selectSettings = () => {
    savePrompt()
    setShowSettings(true)
    router.push(ClientRoute.Settings, undefined, { shallow: true })
  }

  const refreshActiveItem = () => (
    activePrompt ? refreshActivePrompt : activeChain ? refreshActiveChain : refreshActiveProject
  )!()
  const refreshProjects = () => api.getProjects().then(setProjects)

  const {
    g: projectID,
    p: promptID,
    c: chainID,
    s: settings,
    cs: chains,
  } = mapDictionary(ParseQuery(router.query), value => Number(value))
  const currentQueryState = settings
    ? 'settings'
    : promptID ?? chainID ?? (projectID && chains)
    ? `${projectID}chains`
    : projectID
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (settings) {
      selectSettings()
    } else if (promptID) {
      selectPrompt(promptID)
    } else if (chainID) {
      selectChain(chainID)
    } else {
      selectProject(projectID ?? user.id, !!chains)
    }
    setQuery(currentQueryState)
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    selectPrompt(promptID)
    setSelectedTab('play')
  }

  const addChain = async (projectID: number) => {
    const chainID = await api.addChain(projectID)
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

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <UserContext.Provider value={{ loggedInUser: user, availableProviders, showSettings: selectSettings }}>
          <RefreshContext.Provider
            value={{
              refreshProjects,
              resetProject: () => selectProject(user.id),
              refreshProject: refreshActiveProject,
              refreshPrompt: refreshActivePrompt,
              selectTab: setSelectedTab,
              refreshSettings,
            }}>
            <main className={`flex items-stretch h-screen ${inter.className} text-sm`}>
              <Sidebar
                projects={projects}
                activeProject={activeProject}
                activePrompt={activePrompt}
                onAddPrompt={() => addPrompt(user.id)}
                onSelectProject={selectProject}
                onSelectChains={selectChains}
              />
              <div className='flex flex-col flex-1'>
                {!showSettings && (
                  <TopBar
                    projects={projects}
                    activeProject={activeProject}
                    activeItem={activePrompt ?? activeChain}
                    addLabel={isChainMode ? 'New Chain' : 'New Prompt'}
                    onAddItem={isChainMode ? addChain : addPrompt}
                    onSelectProject={(projectID: number) => selectProject(projectID, isChainMode)}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    onRefresh={refreshActiveItem}>
                    {(activePrompt || activeChain) && (
                      <SegmentedControl selected={selectedTab} callback={updateSelectedTab}>
                        <Segment value={'play'} title='Play' />
                        <Segment value={'test'} title='Test' />
                        <Segment value={'publish'} title='Publish' />
                      </SegmentedControl>
                    )}
                  </TopBar>
                )}
                <div className='flex-1 overflow-hidden'>
                  {showSettings && <UserSettingsView />}
                  {!showSettings && activePrompt && activeVersion && (
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
                  {!showSettings && activeChain && <ChainTabView activeTab={selectedTab} chain={activeChain} />}
                  {!showSettings &&
                    !isChainMode &&
                    activeProject &&
                    (activeProject.prompts.length > 0 ? (
                      <ProjectGridView items={activeProject.prompts} projects={projects} onSelectItem={selectPrompt} />
                    ) : (
                      <EmptyGridView
                        title='No Prompts'
                        addLabel='New Prompt'
                        onAddItem={() => addPrompt(activeProject.id)}
                      />
                    ))}
                  {!showSettings &&
                    isChainMode &&
                    activeProject &&
                    (activeProject.chains.length > 0 ? (
                      <ProjectGridView items={activeProject.chains} projects={projects} onSelectItem={selectChain} />
                    ) : (
                      <EmptyGridView
                        title='No Chains'
                        addLabel='New Chain'
                        onAddItem={() => addChain(activeProject.id)}
                      />
                    ))}
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
