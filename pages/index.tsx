import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/src/server/session'
import { useRouter } from 'next/router'
import api from '@/src/client/api'
import { useState } from 'react'
import { Project, ActivePrompt, Version, User, ActiveProject } from '@/types'
import Sidebar from '@/components/sidebar'
import PromptTabView, { ActivePromptTab } from '@/components/promptTabView'
import PromptsGridView from '@/components/promptsGridView'
import { ParseQuery, ProjectRoute, PromptRoute } from '@/components/clientRoute'
import TopBar from '@/components/topBar'
import { getActivePrompt } from '@/src/server/datastore/prompts'
import { getActiveProject, getProjectsForUser } from '@/src/server/datastore/projects'
import SegmentedControl, { Segment } from '@/components/segmentedControl'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/components/modalDialogContext'
import { RefreshContext } from '@/components/refreshContext'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import ChainTabView from '@/components/chainTabView'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query, user }) => {
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(user.id)
  const initialActiveItem = promptID
    ? await getActivePrompt(user.id, promptID, urlBuilderFromHeaders(req.headers))
    : await getActiveProject(user.id, projectID ?? user.id)

  return { props: { user, initialProjects, initialActiveItem } }
})

type ActiveItem = ActiveProject | ActivePrompt

export default function Home({
  user,
  initialProjects,
  initialActiveItem,
}: {
  user: User
  initialProjects: Project[]
  initialActiveItem: ActiveItem
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [projects, setProjects] = useState(initialProjects)

  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const isPrompt = (item: ActiveProject | ActivePrompt): item is ActivePrompt => 'projectID' in (item as ActivePrompt)
  const activeProject = isPrompt(activeItem) ? undefined : activeItem
  const activePrompt = isPrompt(activeItem) ? activeItem : undefined
  const promptProject = activePrompt && projects.find(project => project.id === activePrompt.projectID)

  const [isChainMode, setChainMode] = useState(false)

  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.[0])
  const [modifiedVersion, setModifiedVersion] = useState<Version>()

  const savePrompt = async () => {
    const versionNeedsSaving =
      activePrompt &&
      activeVersion &&
      modifiedVersion &&
      (modifiedVersion.prompt !== activeVersion.prompt ||
        modifiedVersion.config.provider !== activeVersion.config.provider ||
        modifiedVersion.config.temperature !== activeVersion.config.temperature ||
        modifiedVersion.config.maxTokens !== activeVersion.config.maxTokens)
    setModifiedVersion(undefined)
    return versionNeedsSaving
      ? api.updatePrompt(activePrompt.id, modifiedVersion.prompt, modifiedVersion.config, activeVersion.id)
      : activeVersion?.id
  }

  const updateVersion = (version?: Version) => {
    setActiveVersion(version)
    setModifiedVersion(undefined)
  }

  const selectVersion = (version: Version) => {
    if (activePrompt && activeVersion && version.id !== activeVersion.id) {
      savePrompt().then(() => refreshPrompt(activePrompt.id, version.id))
      updateVersion(version)
    }
  }

  const refreshPrompt = async (promptID: number, focusVersionID = activeVersion?.id) => {
    const newPrompt = await api.getPrompt(promptID)
    setActiveItem(newPrompt)
    updateVersion(newPrompt.versions.find(version => version.id === focusVersionID) ?? newPrompt.versions[0])
  }

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      savePrompt()
      await refreshPrompt(promptID)
      router.push(PromptRoute(promptID), undefined, { shallow: true })
    }
  }

  const refreshProject = async (projectID: number) => {
    const newProject = await api.getProject(projectID)
    setActiveItem(newProject)
    updateVersion(undefined)
  }

  const selectProject = async (projectID: number, chainMode = false) => {
    if (projectID !== activeProject?.id || chainMode !== isChainMode) {
      savePrompt()
      await refreshProject(projectID)
      setChainMode(chainMode)
      router.push(ProjectRoute(projectID ?? undefined), undefined, { shallow: true })
    }
  }

  const refreshProjects = () => api.getProjects().then(setProjects)

  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(router.query), value => Number(value))
  const currentQuery = projectID ?? promptID
  const [query, setQuery] = useState(currentQuery)
  if (currentQuery !== query) {
    setQuery(currentQuery)
    if (promptID) {
      selectPrompt(promptID)
    } else {
      selectProject(projectID ?? user.id)
    }
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    selectPrompt(promptID)
  }

  const [selectedTab, setSelectedTab] = useState<ActivePromptTab>('play')
  const updateSelectedTab = (tab: ActivePromptTab) => {
    if (activePrompt) {
      savePrompt().then(versionID => refreshPrompt(activePrompt.id, versionID))
    }
    setSelectedTab(tab)
  }

  const selectChains = () => {
    setChainMode(true)
    if (activePrompt) {
      selectProject(activePrompt.projectID, true)
    }
  }

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <RefreshContext.Provider
          value={{
            refreshProjects,
            resetProject: () => selectProject(user.id),
            refreshProject: activeProject ? () => refreshProject(activeProject.id) : undefined,
            refreshPrompt: activePrompt ? versionID => refreshPrompt(activePrompt.id, versionID) : undefined,
            savePrompt: activeVersion ? () => savePrompt().then(versionID => versionID!) : undefined,
            selectTab: setSelectedTab,
          }}>
          <main className={`flex items-stretch h-screen ${inter.className} text-sm`}>
            <Sidebar
              user={user}
              projects={projects}
              activeProject={activeProject}
              activePrompt={activePrompt}
              onAddPrompt={() => addPrompt(user.id)}
              onSelectProject={selectProject}
              onSelectChains={selectChains}
            />
            <div className='flex flex-col flex-1'>
              <TopBar
                projects={projects}
                activeProject={activeProject}
                activePrompt={activePrompt}
                onAddPrompt={addPrompt}
                onSelectProject={(projectID: number) => selectProject(projectID, isChainMode)}>
                {(activePrompt || isChainMode) && (
                  <SegmentedControl selected={selectedTab} callback={updateSelectedTab}>
                    <Segment value={'play'} title='Play' />
                    <Segment value={'test'} title='Test' />
                    <Segment value={'publish'} title='Publish' />
                  </SegmentedControl>
                )}
              </TopBar>
              <div className='flex-1 overflow-hidden'>
                {!isChainMode && activePrompt && promptProject && activeVersion && (
                  <PromptTabView
                    activeTab={selectedTab}
                    prompt={activePrompt}
                    activeVersion={activeVersion}
                    setActiveVersion={selectVersion}
                    setModifiedVersion={setModifiedVersion}
                  />
                )}
                {!isChainMode && activeProject && (
                  <PromptsGridView
                    prompts={activeProject.prompts}
                    projects={projects}
                    onAddPrompt={() => addPrompt(activeProject.id)}
                    onSelectPrompt={selectPrompt}
                  />
                )}
                {isChainMode && activeProject && (
                  <ChainTabView activeTab={selectedTab} prompts={activeProject.prompts} />
                )}
              </div>
            </div>
          </main>
        </RefreshContext.Provider>
      </ModalDialogContext.Provider>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
