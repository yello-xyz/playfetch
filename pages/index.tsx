import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { Project, ActivePrompt, Version, User, ActiveProject, AvailableProvider } from '@/types'
import Sidebar from '@/components/sidebar'
import PromptTabView, { MainViewTab } from '@/components/promptTabView'
import ClientRoute, { ChainsRoute, ParseQuery, ProjectRoute, PromptRoute } from '@/components/clientRoute'
import TopBar from '@/components/topBar'
import { getActivePrompt } from '@/src/server/datastore/prompts'
import { getActiveProject, getProjectsForUser } from '@/src/server/datastore/projects'
import SegmentedControl, { Segment } from '@/components/segmentedControl'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { RefreshContext } from '@/components/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { UserContext } from '@/components/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/userSettingsView'
import { VersionsEqual } from '@/src/common/versionsEqual'
import ProjectGridView, { EmptyGridView } from '@/components/projectGridView'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { g: projectID, p: promptID, s: settings, c: chains } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(user.id)
  const buildURL = urlBuilderFromHeaders(req.headers)
  const initialActiveItem = promptID
    ? await getActivePrompt(user.id, promptID, buildURL)
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

type ActiveItem = ActiveProject | ActivePrompt

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
  const isPrompt = (item: ActiveProject | ActivePrompt): item is ActivePrompt => 'projectID' in (item as ActivePrompt)
  const activeProject = isPrompt(activeItem) ? undefined : activeItem
  const activePrompt = isPrompt(activeItem) ? activeItem : undefined
  const promptProject = activePrompt && projects.find(project => project.id === activePrompt.projectID)

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

  const refreshProject = async (projectID: number) => {
    const newProject = await api.getProject(projectID)
    setActiveItem(newProject)
    updateVersion(undefined)
  }

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
    const project = activeProject ?? (promptProject as Project)
    selectProject(project.id, true)
    setSelectedTab('play')
    router.push(ChainsRoute(project.id), undefined, { shallow: true })
  }

  const [availableProviders, setAvailableProviders] = useState(initialAvailableProviders)
  const refreshSettings = () => api.getAvailableProviders().then(setAvailableProviders)

  const selectSettings = () => {
    savePrompt()
    setShowSettings(true)
    router.push(ClientRoute.Settings, undefined, { shallow: true })
  }

  const refreshProjects = () => api.getProjects().then(setProjects)

  const {
    g: projectID,
    p: promptID,
    s: settings,
    c: chains,
  } = mapDictionary(ParseQuery(router.query), value => Number(value))
  const currentQueryState = settings ? 'settings' : promptID ?? (projectID && chains) ? `${projectID}chains` : projectID
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (settings) {
      selectSettings()
    } else if (promptID) {
      selectPrompt(promptID)
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
              refreshProject: activeProject ? () => refreshProject(activeProject.id) : undefined,
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
                    activePrompt={activePrompt}
                    onAddPrompt={addPrompt}
                    onSelectProject={(projectID: number) => selectProject(projectID, isChainMode)}
                    showComments={showComments}
                    setShowComments={setShowComments}>
                    {(activePrompt || isChainMode) && (
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
                  {!showSettings && !isChainMode && activePrompt && promptProject && activeVersion && (
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
                  {!showSettings &&
                    !isChainMode &&
                    activeProject &&
                    (activeProject.prompts.length > 0 ? (
                      <ProjectGridView items={activeProject.prompts} projects={projects} onSelectItem={selectPrompt} />
                    ) : (
                      <EmptyGridView
                        title='No Prompts'
                        label='New Prompt'
                        onAddItem={() => addPrompt(activeProject.id)}
                      />
                    ))}
                  {!showSettings && isChainMode && activeProject && (
                    activeProject.chains.length > 0 ? (
                      <ProjectGridView items={activeProject.chains} projects={projects} onSelectItem={selectPrompt} />
                    ) : (
                      <EmptyGridView
                        title='No Chains'
                        label='New Chain'
                        onAddItem={() => {}}
                      />
                    )
                  )}
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
