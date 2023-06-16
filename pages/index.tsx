import { getGroupedPromptsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useEffect, useState } from 'react'
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
  const { prompts: initialPrompts, projects: initialProjects } = await getGroupedPromptsForUser(userID)
  const initialActiveProject = projectID ? initialProjects.find(project => project.id === projectID) : null
  const initialActivePrompt = findActivePrompt(initialPrompts, initialProjects, promptID) ?? null
  const initialVersions = initialActivePrompt ? await getVersionsForPrompt(userID, initialActivePrompt.id) : []
  const initialActiveVersion = initialVersions[0] ?? null
  return {
    props: {
      initialPrompts,
      initialProjects,
      initialActiveProject,
      initialActivePrompt,
      initialVersions,
      initialActiveVersion,
    },
  }
})

export default function Home({
  initialPrompts,
  initialProjects,
  initialActiveProject,
  initialActivePrompt,
  initialVersions,
  initialActiveVersion,
}: {
  initialPrompts: Prompt[]
  initialProjects: Project[]
  initialActiveProject?: Project
  initialActivePrompt?: Prompt
  initialVersions: Version[]
  initialActiveVersion?: Version
}) {
  const router = useRouter()
  const refreshData = () => router.replace(router.asPath)

  const [prompts, setPrompts] = useState(initialPrompts)
  const [projects, setProjects] = useState(initialProjects)
  const [activeProject, setActiveProject] = useState(initialActiveProject)
  const [activePrompt, setActivePrompt] = useState(initialActivePrompt)
  const [versions, setVersions] = useState(initialVersions)
  const [activeVersion, setActiveVersion] = useState(initialActiveVersion)
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const updateActiveVersion = (version: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const hasActivePrompt = (project: Project) => project.prompts.some(prompt => prompt.id === activePrompt?.id)

  const refreshProjects = async (promptID?: number) => {
    const oldIndex = projects.findIndex(hasActivePrompt)
    const { prompts: newPrompts, projects: newProjects } = await api.getGroupedPrompts()
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

  const updateActivePrompt = (prompt?: Prompt) => {
    if (prompt?.id !== activePrompt?.id) {
      if (activePrompt) {
        savePrompt()
      }
      setActiveProject(undefined)
      setActivePrompt(prompt)
      router.push(PromptRoute(prompt?.id), undefined, { shallow: true })
      refreshVersions(prompt?.id)
    }
  }

  const updateActiveProject = (project?: Project) => {
    setActiveProject(project)
    setActivePrompt(undefined)
    router.push(ProjectRoute(project?.id), undefined, { shallow: true })
  }

  const { g: projectID, p: promptID } = mapDictionary(ParseQuery(router.query), value => Number(value))
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

  return (
    <main className={`flex items-stretch h-screen ${inter.className}`}>
      <ProjectSidebar
        projects={projects}
        setActiveProject={updateActiveProject}
        onLogout={refreshData}
        onRefresh={refreshProjects}
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
          onRefreshProjects={refreshProjects}
          onRefreshVersions={refreshVersions}
        />
      ) : (
        <PromptsGridView prompts={activeProject ? activeProject.prompts : prompts} onSelect={updateActivePrompt} />
      )}
    </main>
  )
}
