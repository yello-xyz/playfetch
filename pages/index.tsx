import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useState } from 'react'
import { Project, Prompt, ActivePrompt, Version, User } from '@/types'
import Sidebar from '@/client/sidebar'
import PromptTabView, { ActivePromptTab } from '@/client/promptTabView'
import PromptsGridView from '@/client/promptsGridView'
import { ParseQuery, ProjectRoute, PromptRoute } from '@/client/clientRoute'
import TopBar from '@/client/topBar'
import { getPromptWithVersions, getPromptsForProject } from '@/server/datastore/prompts'
import { getProjectsForUser } from '@/server/datastore/projects'
import SegmentedControl, { Segment } from '@/client/segmentedControl'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import PickProjectDialog, { PickProjectPrompt } from '@/client/pickProjectDialog'
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
  const initialPrompts = promptID ? [] : await getPromptsForProject(user.id, projectID ?? null)
  const initialPrompt = promptID ? await getPromptWithVersions(user.id, promptID) : null

  return { props: { user, initialProjects, initialPrompts, initialPrompt } }
})

export default function Home({
  user,
  initialProjects,
  initialPrompts,
  initialPrompt,
}: {
  user: User
  initialProjects: Project[]
  initialPrompts: Prompt[]
  initialPrompt?: ActivePrompt
}) {
  const router = useRouter()

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()
  const [pickProjectPrompt, setPickProjectPrompt] = useState<PickProjectPrompt>()

  const [projects, setProjects] = useState(initialProjects)
  const [prompts, setPrompts] = useState(initialPrompts)

  const [activePrompt, setActivePrompt] = useState(initialPrompt)
  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.[0])
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const selectVersion = (version?: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const savePrompt = async () => {
    if (!activePrompt || !activeVersion || !dirtyVersion) {
      return activeVersion?.id
    }
    const versionID = await api.updatePrompt(
      activePrompt.id,
      dirtyVersion.prompt,
      dirtyVersion.config,
      activeVersion.id
    )
    return versionID
  }

  const refreshPrompt = async (promptID: number | undefined, focusVersionID = activeVersion?.id) => {
    const newPrompt = promptID ? await api.getPrompt(promptID) : undefined
    setActivePrompt(newPrompt)
    setActiveProjectID(newPrompt ? undefined : activeProjectID)
    const focusedVersion = newPrompt?.versions?.find(version => version.id === focusVersionID)
    selectVersion(focusedVersion ?? newPrompt?.versions?.[0])
  }

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      savePrompt()
      await refreshPrompt(promptID)
      router.push(PromptRoute(promptID), undefined, { shallow: true })
    }
  }

  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(router.query), value => Number(value))
  const [activeProjectID, setActiveProjectID] = useState(activePrompt ? undefined : projectID ?? null)

  const refreshProject = async (projectID: number | null) => {
    const newPrompts = await api.getPrompts(projectID)
    setPrompts(newPrompts)
    refreshPrompt(undefined)
    setActiveProjectID(projectID)
  }

  const selectProject = async (projectID: number | null) => {
    if (projectID !== activeProjectID) {
      savePrompt()
      refreshProject(projectID)
      router.push(ProjectRoute(projectID ?? undefined), undefined, { shallow: true })
    }
  }

  const refreshProjects = () => api.getProjects().then(setProjects)

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
          setPickProjectPrompt: projects.length ? setPickProjectPrompt : undefined,
        }}>
        <RefreshContext.Provider
          value={{
            refreshPage: () => router.replace(router.asPath).then(),
            refreshProjects,
            selectProject,
            refreshProject: activeProjectID ? () => refreshProject(activeProjectID) : undefined,
            selectPrompt,
            refreshPrompt: activePrompt ? versionID => refreshPrompt(activePrompt.id, versionID) : undefined,
            savePrompt: activeVersion ? () => savePrompt().then(versionID => versionID!) : undefined,
          }}>
          <main className={`flex items-stretch h-screen ${inter.className} text-sm`}>
            <Sidebar
              user={user}
              projects={projects}
              activeProjectID={activeProjectID}
              onAddPrompt={() => addPrompt(null)}
            />
            <div className='flex flex-col flex-1'>
              <TopBar
                projects={projects}
                activeProjectID={activeProjectID}
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
                {activePrompt && activeVersion ? (
                  <PromptTabView
                    activeTab={selectedTab}
                    prompt={activePrompt}
                    project={projects.find(project => project.id === activePrompt.projectID)}
                    activeVersion={activeVersion}
                    setActiveVersion={selectVersion}
                    setDirtyVersion={setDirtyVersion}
                  />
                ) : (
                  <PromptsGridView prompts={prompts} onAddPrompt={() => addPrompt(activeProjectID!)} />
                )}
              </div>
            </div>
          </main>
        </RefreshContext.Provider>
      </ModalDialogContext.Provider>
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
      <PickNameDialog prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
      <PickProjectDialog
        key={pickProjectPrompt?.initialProjectID}
        projects={projects}
        prompt={pickProjectPrompt}
        setPrompt={setPickProjectPrompt}
      />
    </>
  )
}
