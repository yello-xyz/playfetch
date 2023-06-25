import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useState } from 'react'
import { Project, ActivePrompt, Version, User, ActiveProject } from '@/types'
import Sidebar from '@/client/sidebar'
import PromptTabView, { ActivePromptTab } from '@/client/promptTabView'
import PromptsGridView from '@/client/promptsGridView'
import { ParseQuery, ProjectRoute, PromptRoute } from '@/client/clientRoute'
import TopBar from '@/client/topBar'
import { getActivePrompt } from '@/server/datastore/prompts'
import { getActiveProject, getProjectsForUser } from '@/server/datastore/projects'
import SegmentedControl, { Segment } from '@/client/segmentedControl'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import PickNameDialog, { PickNamePrompt } from '@/client/pickNameDialog'
import { ModalDialogContext } from '@/client/modalDialogContext'
import { RefreshContext } from '@/client/refreshContext'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query }) => {
  const user = req.session.user!
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(user.id)
  const initialProject = promptID ? null : await getActiveProject(user.id, projectID ?? null)
  const initialPrompt = promptID ? await getActivePrompt(user.id, promptID) : null

  return { props: { user, initialProjects, initialProject, initialPrompt } }
})

export default function Home({
  user,
  initialProjects,
  initialProject,
  initialPrompt,
}: {
  user: User
  initialProjects: Project[]
  initialProject?: ActiveProject
  initialPrompt?: ActivePrompt
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()

  const [projects, setProjects] = useState(initialProjects)

  const [activeProject, setActiveProject] = useState(initialProject)
  const [activePrompt, setActivePrompt] = useState(initialPrompt)
  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.[0])
  const [modifiedVersion, setModifiedVersion] = useState<Version>()

  const selectVersion = (version?: Version) => {
    setActiveVersion(version)
    setModifiedVersion(undefined)
  }

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

  const refreshPrompt = async (promptID: number | undefined, focusVersionID = activeVersion?.id) => {
    const newPrompt = promptID ? await api.getPrompt(promptID) : undefined
    setActivePrompt(newPrompt)
    setActiveProject(newPrompt ? undefined : activeProject)
    const newVersions = newPrompt ? newPrompt.versions : []
    selectVersion(newVersions.find(version => version.id === focusVersionID) ?? newVersions[0])
  }

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      savePrompt()
      await refreshPrompt(promptID)
      router.push(PromptRoute(promptID), undefined, { shallow: true })
    }
  }

  const refreshProject = async (projectID: number | null) => {
    const newProject = await api.getProject(projectID)
    refreshPrompt(undefined)
    setActiveProject(newProject)
  }

  const selectProject = async (projectID: number | null) => {
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
      selectProject(projectID ?? null)
    }
  }

  const addPrompt = async (projectID: number | null) => {
    const promptID = await api.addPrompt(projectID)
    selectPrompt(promptID)
  }

  const [selectedTab, setSelectedTab] = useState<ActivePromptTab>('play')

  return (
    <>
      <ModalDialogContext.Provider
        value={{
          setDialogPrompt,
          setPickNamePrompt,
        }}>
        <RefreshContext.Provider
          value={{
            refreshPage: () => router.replace(router.asPath).then(),
            refreshProjects,
            selectProject,
            refreshProject: activeProject ? () => refreshProject(activeProject.id) : undefined,
            selectPrompt,
            refreshPrompt: activePrompt ? versionID => refreshPrompt(activePrompt.id, versionID) : undefined,
            savePrompt: activeVersion ? () => savePrompt().then(versionID => versionID!) : undefined,
          }}>
          <main className={`flex items-stretch h-screen ${inter.className} text-sm`}>
            <Sidebar
              user={user}
              projects={projects}
              activeProject={activeProject}
              onAddPrompt={() => addPrompt(null)}
            />
            <div className='flex flex-col flex-1'>
              <TopBar
                projects={projects}
                activeProject={activeProject}
                activePrompt={activePrompt}
                onAddPrompt={addPrompt}>
                {activePrompt && (
                  <SegmentedControl selected={selectedTab} callback={setSelectedTab}>
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
                    project={projects.find(project => project.id === activePrompt.projectID)}
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
      <PickNameDialog prompt={pickNamePrompt} onDismiss={() => setPickNamePrompt(undefined)} />
    </>
  )
}
