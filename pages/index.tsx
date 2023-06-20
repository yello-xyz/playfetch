import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useState } from 'react'
import { Project, Prompt, ActivePrompt, Version } from '@/types'
import Sidebar from '@/client/sidebar'
import PromptTabView from '@/client/promptTabView'
import PromptsGridView from '@/client/promptsGridView'
import { ParseQuery, ProjectRoute, PromptRoute } from '@/client/clientRoute'
import TopBar from '@/client/topBar'
import { getPromptWithVersions, getPromptsForProject } from '@/server/datastore/prompts'
import { getProjectsForUser } from '@/server/datastore/projects'
import SegmentedControl, { Segment } from '@/client/segmentedControl'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500'] })

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query }) => {
  const userID = req.session.user!.id
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(userID)
  const initialPrompts = promptID ? [] : await getPromptsForProject(userID, projectID ?? null)
  const initialPrompt = promptID ? await getPromptWithVersions(userID, promptID) : null

  return { props: { initialProjects, initialPrompts, initialPrompt } }
})

export default function Home({
  initialProjects,
  initialPrompts,
  initialPrompt,
}: {
  initialProjects: Project[]
  initialPrompts: Prompt[]
  initialPrompt?: ActivePrompt
}) {
  const router = useRouter()

  const [projects, setProjects] = useState(initialProjects)
  const [prompts, setPrompts] = useState(initialPrompts)

  const [activePrompt, setActivePrompt] = useState(initialPrompt)
  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.[0])
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const selectVersion = (version?: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const savePrompt = async (onSaved?: (versionID: number) => void) => {
    if (!activePrompt || !activeVersion || !dirtyVersion) {
      return activeVersion?.id
    }
    const versionID = await api.updatePrompt(activePrompt.id, dirtyVersion.prompt, dirtyVersion.tags, activeVersion.id)
    onSaved?.(versionID)
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

  const refreshProjectsAndFocus = async (focusProjectID: number) => {
    const newProjects = await api.getProjects()
    setProjects(newProjects)
    selectProject(focusProjectID)
  }

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

  const [selectedTab, setSelectedTab] = useState<'play' | 'test' | 'publish'>('play')

  return (
    <>
      <main className={`flex items-stretch h-screen ${inter.className}`}>
        <Sidebar
          projects={projects}
          activeProjectID={activeProjectID}
          onSelectProject={selectProject}
          onLogout={() => router.replace(router.asPath)}
          onProjectAdded={refreshProjectsAndFocus}
          onAddPrompt={() => addPrompt(null)}
        />
        <div className='flex flex-col flex-grow'>
          <TopBar
            projects={projects}
            activeProjectID={activeProjectID}
            activePrompt={activePrompt}
            onSelectProject={selectProject}
            onAddPrompt={addPrompt}
            onRefreshPrompt={() => refreshPrompt(activePrompt!.id)}>
            {activePrompt && (
              <SegmentedControl selected={selectedTab} callback={setSelectedTab}>
                <Segment value={'play'} title='Play' />
                <Segment value={'test'} title='Test' />
                <Segment value={'publish'} title='Publish' />
              </SegmentedControl>
            )}
          </TopBar>
          {activePrompt && activeVersion ? (
            <PromptTabView
              prompt={activePrompt}
              project={projects.find(project => project.id === activePrompt.projectID)}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              setDirtyVersion={setDirtyVersion}
              onSavePrompt={onSaved => savePrompt(onSaved).then(versionID => versionID!)}
              onPromptDeleted={selectProject}
              onRefreshPrompt={focusVersionID => refreshPrompt(activePrompt.id, focusVersionID)}
            />
          ) : (
            <PromptsGridView
              projects={projects}
              prompts={prompts}
              onAddPrompt={() => addPrompt(activeProjectID!)}
              onSelect={selectPrompt}
              onRefresh={() => refreshProject(activeProjectID!)}
            />
          )}
        </div>
      </main>
    </>
  )
}
