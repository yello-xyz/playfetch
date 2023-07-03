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

type ActiveItem = ActiveProject | ActivePrompt | { mode: 'Chains' }

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
  const activeProject = 'isUserProject' in activeItem ? activeItem as ActiveProject : undefined
  const activePrompt = 'projectID' in activeItem ? activeItem as ActivePrompt : undefined
  const isChainMode = !activeProject && !activePrompt
  const promptProject = activePrompt && projects.find(project => project.id === activePrompt.projectID)

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

  const selectProject = async (projectID: number) => {
    if (projectID !== activeProject?.id) {
      savePrompt()
      await refreshProject(projectID)
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
    savePrompt().then(versionID => refreshPrompt(activePrompt!.id, versionID))
    setSelectedTab(tab)
  }

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <RefreshContext.Provider
          value={{
            refreshProjects,
            selectProject,
            selectUserProject: () => selectProject(user.id),
            refreshProject: activeProject ? () => refreshProject(activeProject.id) : undefined,
            selectPrompt,
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
              onSelectChains={() => setActiveItem({ mode: 'Chains' })}
            />
            <div className='flex flex-col flex-1'>
              <TopBar
                projects={projects}
                activeProject={activeProject}
                activePrompt={activePrompt}
                onAddPrompt={addPrompt}>
                {(activePrompt || isChainMode) && (
                  <SegmentedControl selected={selectedTab} callback={updateSelectedTab}>
                    <Segment value={'play'} title='Play' />
                    <Segment value={'test'} title='Test' />
                    <Segment value={'publish'} title='Publish' />
                  </SegmentedControl>
                )}
              </TopBar>
              <div className='flex-1 overflow-hidden'>
                {activePrompt && promptProject && activeVersion && (
                  <PromptTabView
                    activeTab={selectedTab}
                    prompt={activePrompt}
                    activeVersion={activeVersion}
                    setActiveVersion={selectVersion}
                    setModifiedVersion={setModifiedVersion}
                  />
                )}
                {activeProject && (
                  <PromptsGridView
                    prompts={activeProject.prompts}
                    projects={projects}
                    onAddPrompt={() => addPrompt(activeProject.id)}
                  />
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
