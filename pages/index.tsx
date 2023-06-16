import { getProjectsForUser, getPromptWithVersions, getPromptsForProject } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useState } from 'react'
import { Project, Prompt, PromptWithVersions, Version } from '@/types'
import ProjectSidebar from '@/client/projectSidebar'
import PromptTabView from '@/client/promptTabView'
import PromptsGridView from '@/client/promptsGridView'
import { ParseQuery, ProjectRoute, PromptRoute } from '@/client/clientRoute'

const inter = Inter({ subsets: ['latin'] })

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query }) => {
  const userID = req.session.user!.id
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(userID)
  const initialPrompts = promptID ? [] : await getPromptsForProject(userID, projectID ?? null)
  const initialPrompt = promptID ? await getPromptWithVersions(userID, promptID) : undefined

  return { props: { initialProjects, initialPrompts, initialPrompt } }
})

export default function Home({
  initialProjects,
  initialPrompts,
  initialPrompt,
}: {
  initialProjects: Project[]
  initialPrompts: Prompt[]
  initialPrompt?: PromptWithVersions
}) {
  const router = useRouter()
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(router.query), value => Number(value))
  const refreshData = () => router.replace(router.asPath)

  const [projects, setProjects] = useState(initialProjects)
  const [prompts, setPrompts] = useState(initialPrompts)

  const [activePrompt, setActivePrompt] = useState(initialPrompt)
  const [activeVersion, setActiveVersion] = useState(activePrompt?.versions?.[0])
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const updateActiveVersion = (version?: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const refreshProjects = async () => api.getProjects().then(setProjects)

  const savePrompt = async (onSaved?: (versionID: number) => void) => {
    if (!dirtyVersion) {
      return activeVersion!.id
    }
    const versionID = await api.updatePrompt(
      activePrompt!.id,
      dirtyVersion.prompt,
      dirtyVersion.title,
      dirtyVersion.tags,
      activeVersion!.id
    )
    onSaved?.(versionID)
    return versionID
  }

  const refreshPrompt = async (promptID = activePrompt?.id, focusVersionID = activeVersion?.id) => {
    const newPrompt = promptID ? await api.getPrompt(promptID) : undefined
    setActivePrompt(newPrompt)
    const focusedVersion = newPrompt?.versions?.find(version => version.id === focusVersionID)
    updateActiveVersion(focusedVersion ?? newPrompt?.versions?.[0])
  }

  const selectPrompt = async (promptID: number) => {
    if (promptID !== activePrompt?.id) {
      if (activePrompt) {
        savePrompt()
      }
      await refreshPrompt(promptID)
      router.push(PromptRoute(promptID), undefined, { shallow: true })
    }
  }

  const selectProject = async (projectID: number | null) => {
    // TODO need to save prompt if dirty?
    const newPrompts = await api.getPrompts(projectID)
    setPrompts(newPrompts)
    setActivePrompt(undefined)
    router.push(ProjectRoute(projectID ?? undefined), undefined, { shallow: true })
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
    const prompt = await api.addPrompt(projectID)
    selectPrompt(prompt.id)
  }

  return (
    <main className={`flex items-stretch h-screen ${inter.className}`}>
      <ProjectSidebar
        projects={projects}
        onSelectProject={selectProject}
        onLogout={refreshData}
        onProjectAdded={refreshProjects}
        onAddPrompt={() => addPrompt(null)}
      />
      {activePrompt && activeVersion ? (
        <PromptTabView
          prompt={activePrompt}
          project={projects.find(project => project.id === activePrompt.projectID)}
          activeVersion={activeVersion}
          setActiveVersion={updateActiveVersion}
          setDirtyVersion={setDirtyVersion}
          onSavePrompt={savePrompt}
          onPromptDeleted={selectProject}
          onRefreshPrompt={focusVersionID => refreshPrompt(activePrompt.id, focusVersionID)}
        />
      ) : (
        <PromptsGridView prompts={prompts} onSelect={selectPrompt} />
      )}
    </main>
  )
}
