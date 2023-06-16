import { getProjectsForUser, getPromptForUser, getPromptsForProject, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useState } from 'react'
import { Project, Prompt, Version } from '@/types'
import ProjectSidebar from '@/client/projectSidebar'
import PromptTabView from '@/client/promptTabView'
import PromptsGridView from '@/client/promptsGridView'
import { ParseQuery, ProjectRoute, PromptRoute } from '@/client/clientRoute'

const inter = Inter({ subsets: ['latin'] })

const findActivePrompt = (prompts: Prompt[], projects: Project[], promptID?: number) =>
  [...prompts, ...projects.flatMap(project => project.prompts)].find(prompt => prompt.id === promptID)

const mapDictionary = <T, U>(dict: NodeJS.Dict<T>, mapper: (value: T) => U): NodeJS.Dict<U> =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, v ? mapper(v) : undefined]))

export const getServerSideProps = withLoggedInSession(async ({ req, query }) => {
  const userID = req.session.user!.id
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(query), value => Number(value))

  const initialProjects = await getProjectsForUser(userID)

  const initialPrompts = promptID ? [] : await getPromptsForProject(userID, projectID ?? null)

  const initialPrompt = promptID ? await getPromptForUser(userID, promptID) : undefined
  const initialVersions = promptID ? await getVersionsForPrompt(userID, promptID) : []

  return { props: { initialProjects, initialPrompts, initialPrompt, initialVersions } }
})

export default function Home({
  initialProjects,
  initialPrompts,
  initialPrompt,
  initialVersions,
}: {
  initialProjects: Project[]
  initialPrompts: Prompt[]
  initialPrompt?: Prompt
  initialVersions: Version[]
}) {
  const router = useRouter()
  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(router.query), value => Number(value))
  const refreshData = () => router.replace(router.asPath)

  const [projects, setProjects] = useState(initialProjects)
  const [activeProject, setActiveProject] = useState(initialProjects.find(project => project.id === projectID))
  const [prompts, setPrompts] = useState(initialPrompts)

  const [activePrompt, setActivePrompt] = useState(initialPrompt)
  const [versions, setVersions] = useState(initialVersions)
  const [activeVersion, setActiveVersion] = useState(initialVersions[0])
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const updateActiveVersion = (version: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const hasActivePrompt = (project: Project) => project.prompts.some(prompt => prompt.id === activePrompt?.id)

  const refreshProjects = async (promptID?: number) => {
    const oldIndex = projects.findIndex(hasActivePrompt)
    const newProjects = await api.getProjects()
    const newPrompts = await api.getPrompts(null)
    if (!newPrompts.length && !newProjects.length) {
      refreshData()
    } else {
      setPrompts(newPrompts)
      setProjects(newProjects)
      const newActivePrompt = findActivePrompt(newPrompts, newProjects, promptID)
      if (newActivePrompt) {
        updateActivePrompt(newActivePrompt)
      } else if (newPrompts.length && (!newProjects.length || oldIndex < 0)) {
        updateActivePrompt(prompts[0])
      } else {
        const newIndex = Math.max(0, Math.min(newProjects.length - 1, oldIndex))
        updateActivePrompt(newProjects[newIndex].prompts[0])
      }
    }
  }

  const refreshPrompts = async () => {
    const newPrompts = await api.getPrompts(projectID ?? null)
    setPrompts(newPrompts)
  }

  const refreshVersions = async (promptID = activePrompt?.id, focusID = activeVersion?.id) => {
    const newVersions = promptID ? await api.getVersions(promptID) : []
    setVersions(newVersions)
    const focusedVersion = newVersions.find(version => version.id === focusID)
    updateActiveVersion(focusedVersion ?? newVersions[0])
  }

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
    refreshProjects()
    onSaved?.(versionID)
    return versionID
  }

  const updateActivePrompt = async (prompt?: Prompt) => {
    if (prompt?.id !== activePrompt?.id) {
      if (activePrompt) {
        savePrompt()
      }
      await refreshVersions(prompt?.id)
      setActivePrompt(prompt)
      setActiveProject(undefined)
      router.push(PromptRoute(prompt?.id), undefined, { shallow: true })
    }
  }

  const updateActiveProject = (project?: Project) => {
    setActiveProject(project)
    setActivePrompt(undefined)
    router.push(ProjectRoute(project?.id), undefined, { shallow: true })
  }

  const currentQuery = projectID ?? promptID
  const [query, setQuery] = useState(currentQuery)
  if (currentQuery !== query) {
    setQuery(currentQuery)
    if (promptID) {
      updateActivePrompt(findActivePrompt(prompts, projects, promptID))
    } else {
      updateActiveProject(projects.find(project => project.id === projectID))
    }
  }

  const addPrompt = async (projectID: number | null) => {
    const prompt = await api.addPrompt(projectID)
    refreshProjects(prompt.id)
  }

  return (
    <main className={`flex items-stretch h-screen ${inter.className}`}>
      <ProjectSidebar
        projects={projects}
        setActiveProject={updateActiveProject}
        onLogout={refreshData}
        onRefreshProjects={refreshProjects}
        onAddPrompt={() => addPrompt(null)}
      />
      {activePrompt && activeVersion ? (
        <PromptTabView
          prompt={activePrompt}
          project={projects.find(hasActivePrompt)}
          versions={versions}
          activeVersion={activeVersion}
          setActiveVersion={updateActiveVersion}
          setDirtyVersion={setDirtyVersion}
          onSavePrompt={savePrompt}
          onRefreshPrompts={refreshPrompts}
          onRefreshVersions={refreshVersions}
        />
      ) : (
        <PromptsGridView prompts={activeProject ? activeProject.prompts : prompts} onSelect={updateActivePrompt} />
      )}
    </main>
  )
}
