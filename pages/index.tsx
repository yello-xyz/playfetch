import { getGroupedPromptsForUser } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import { useState } from 'react'
import { Project, Prompt, Version } from '@/types'
import ProjectSidebar from '@/client/projectSidebar'
import PromptTabView from '@/client/promptTabView'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async ({ req }) => {
  const userID = req.session.user!.id
  const { prompts: initialPrompts, projects: initialProjects } = await getGroupedPromptsForUser(userID)
  return { props: { initialPrompts, initialProjects } }
})

export default function Home({
  initialPrompts,
  initialProjects,
}: {
  initialPrompts: Prompt[]
  initialProjects: Project[]
}) {
  const router = useRouter()
  const refreshData = () => router.replace(router.asPath)

  const [prompts, setPrompts] = useState(initialPrompts)
  const [projects, setProjects] = useState(initialProjects)
  const [activeProject, setActiveProject] = useState<Project>()
  const [activePrompt, setActivePrompt] = useState<Prompt>()
  const [versions, setVersions] = useState([] as Version[])
  const [activeVersion, setActiveVersion] = useState<Version>()
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const updateActivePrompt = (prompt?: Prompt) => {
    if (prompt?.id !== activePrompt?.id) {
      if (activePrompt) {
        savePrompt()
      }
      setActivePrompt(prompt)
      refreshVersions(prompt?.id)
    }
  }

  const updateActiveVersion = (version: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const findActivePrompt = (prompts: Prompt[], projects: Project[], promptID = activePrompt?.id) =>
    [...prompts, ...projects.flatMap(project => project.prompts)].find(prompt => prompt.id === promptID)

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

  return (
    <main className={`flex items-stretch h-screen ${inter.className}`}>
      <ProjectSidebar
        prompts={prompts}
        projects={projects}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
        activePrompt={activePrompt}
        setActivePrompt={updateActivePrompt}
        onLogout={refreshData}
        onRefresh={refreshProjects}
      />
      {activePrompt && activeVersion && (
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
      )}
    </main>
  )
}
