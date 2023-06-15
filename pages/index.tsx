import { getGroupedPromptsForUser, getVersionsForPrompt } from '@/server/datastore'
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
  const { prompts, projects } = await getGroupedPromptsForUser(userID)
  const activePromptID = prompts[0]?.id ?? projects[0].prompts[0].id
  const versions = projects.length ? await getVersionsForPrompt(userID, activePromptID) : []
  return { props: { prompts, projects, activePromptID, versions } }
})

export default function Home({
  prompts,
  projects,
  activePromptID,
  versions,
}: {
  prompts: Prompt[]
  projects: Project[]
  activePromptID: number
  versions: Version[]
}) {
  const router = useRouter()
  const refreshData = () => router.replace(router.asPath)

  return prompts.length || projects.length ? (
    <HomeWithProjects
      initialPrompts={prompts}
      initialProjects={projects}
      initialActivePromptID={activePromptID}
      initialVersions={versions}
      initialActiveVersion={versions[0]}
      refreshData={refreshData}
    />
  ) : (
    <ProjectSidebar onLogout={refreshData} onRefresh={refreshData} />
  )
}

function HomeWithProjects({
  initialPrompts,
  initialProjects,
  initialActivePromptID,
  initialVersions,
  initialActiveVersion,
  refreshData,
}: {
  initialPrompts: Prompt[]
  initialProjects: Project[]
  initialActivePromptID: number
  initialVersions: Version[]
  initialActiveVersion: Version
  refreshData: () => void
}) {
  const [prompts, setPrompts] = useState(initialPrompts)
  const [projects, setProjects] = useState(initialProjects)
  const [activePromptID, setActivePromptID] = useState(initialActivePromptID)
  const [versions, setVersions] = useState(initialVersions)
  const [activeVersion, setActiveVersion] = useState(initialActiveVersion)
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const updateActivePrompt = (promptID: number) => {
    if (promptID !== activePromptID) {
      savePrompt()
      setActivePromptID(promptID)
      refreshVersions(promptID)
    }
  }

  const updateActiveVersion = (version: Version) => {
    setActiveVersion(version)
    setDirtyVersion(undefined)
  }

  const findActivePrompt = (prompts: Prompt[], projects: Project[]) =>
    [...prompts, ...projects.flatMap(project => project.prompts)].find(prompt => prompt.id === activePromptID)

  const activePrompt = findActivePrompt(prompts, projects)
  const hasActivePrompt = (project: Project) => project.prompts.some(prompt => prompt.id === activePromptID)

  const refreshProjects = async () => {
    const oldIndex = projects.findIndex(hasActivePrompt)
    const { prompts: newPrompts, projects: newProjects } = await api.getGroupedPrompts()
    if (!newPrompts.length && !newProjects.length) {
      refreshData()
    } else {
      setPrompts(newPrompts)
      setProjects(newProjects)
      if (!findActivePrompt(newPrompts, newProjects)) {
        if (newPrompts.length && (!newProjects.length || oldIndex < 0)) {
          updateActivePrompt(prompts[0].id)
        } else {
          const newIndex = Math.max(0, Math.min(newProjects.length - 1, oldIndex))
          updateActivePrompt(newProjects[newIndex].prompts[0].id)
        }
      }
    }
  }

  const refreshProjectsAndRefocus = async (promptID?: number) => {
    await refreshProjects()
    if (promptID) {
      updateActivePrompt(promptID)
    }
  }

  const refreshVersions = async (promptID = activePromptID, focusID = activeVersion.id) => {
    const newVersions = await api.getVersions(promptID)
    setVersions(newVersions)
    const focusedVersion = newVersions.find(version => version.id === focusID)
    updateActiveVersion(focusedVersion ?? newVersions[0])
  }

  const savePrompt = async (onSaved?: (versionID: number) => void) => {
    if (!dirtyVersion) {
      return activeVersion.id
    }
    const versionID = await api.updatePrompt(
      activePromptID,
      dirtyVersion.prompt,
      dirtyVersion.title,
      dirtyVersion.tags,
      activeVersion.id
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
        activePromptID={activePromptID}
        updateActivePrompt={updateActivePrompt}
        onLogout={refreshData}
        onRefresh={refreshProjectsAndRefocus}
      />
      {activePrompt && (
        <PromptTabView
          prompt={activePrompt}
          project={projects.find(hasActivePrompt)}
          versions={versions}
          activeVersion={activeVersion}
          setDirtyVersion={setDirtyVersion}
          onSavePrompt={savePrompt}
          onSelectVersion={updateActiveVersion}
          onRefreshProjects={refreshProjects}
          onRefreshVersions={refreshVersions}
        />
      )}
    </main>
  )
}
