import { getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { Suspense, useState } from 'react'
import { Project, Run, RunConfig, Version } from '@/types'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import VersionTimeline from '@/client/versionTimeline'
import ProjectSidebar from '@/client/projectSidebar'

import dynamic from 'next/dynamic'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

const inter = Inter({ subsets: ['latin'] })

const versionFilter = (filter: string) => (version: Version) => {
  const lowerCaseFilter = filter.toLowerCase()
  return (
    version.title.toLowerCase().includes(lowerCaseFilter) ||
    version.tags.toLowerCase().includes(lowerCaseFilter) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

export const getServerSideProps = withLoggedInSession(async ({ req }) => {
  const userID = req.session.user!.id
  const projects = await getProjectsForUser(userID)
  const versions = projects.length ? await getVersionsForPrompt(userID, projects[0].prompts[0].id) : []
  return { props: { projects, versions } }
})

export default function Home({ projects, versions }: { projects: Project[]; versions: Version[] }) {
  const router = useRouter()
  const refreshData = () => router.replace(router.asPath)

  return projects.length ? (
    <HomeWithProjects
      initialProjects={projects}
      initialActivePromptID={projects[0].prompts[0].id}
      initialVersions={versions}
      initialActiveVersion={versions[0]}
      refreshData={refreshData}
    />
  ) : (
    <ProjectSidebar onLogout={refreshData} onRefresh={refreshData} />
  )
}

function HomeWithProjects({
  initialProjects,
  initialActivePromptID,
  initialVersions,
  initialActiveVersion,
  refreshData,
}: {
  initialProjects: Project[]
  initialActivePromptID: number
  initialVersions: Version[]
  initialActiveVersion: Version
  refreshData: () => void
}) {
  const [projects, setProjects] = useState(initialProjects)
  const [activePromptID, setActivePromptID] = useState(initialActivePromptID)
  const [versions, setVersions] = useState(initialVersions)
  const [activeVersion, setActiveVersion] = useState(initialActiveVersion)
  const [activeRun, setActiveRun] = useState<Run>()
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const [filter, setFilter] = useState('')
  const [curlCommand, setCURLCommand] = useState<string>()
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

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
    setActiveRun(undefined)
  }

  const selectActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      savePrompt(_ => refreshVersions())
      updateActiveVersion(version)
    }
  }

  const hasActivePrompt = (project: Project) => project.prompts.some(prompt => prompt.id === activePromptID)
  const activeProject = projects.find(hasActivePrompt)!

  const refreshProjects = async () => {
    const oldIndex = projects.findIndex(hasActivePrompt)
    const newProjects = await api.getProjects()
    if (!newProjects.length) {
      refreshData()
    } else {
      setProjects(newProjects)
      if (!newProjects.some(hasActivePrompt)) {
        const newIndex = Math.max(0, Math.min(newProjects.length - 1, oldIndex))
        updateActivePrompt(newProjects[newIndex].prompts[0].id)
      }
    }
  }

  const refreshProjectsAndRefocus = async (promptID: number) => {
    await refreshProjects()
    updateActivePrompt(promptID)
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

  const savePromptAndRefocus = () => savePrompt(versionID => refreshVersions(activePromptID, versionID))

  const runPrompt = async (prompt: string, config: RunConfig) => {
    const versionID = await savePromptAndRefocus()
    await api.runPrompt(activePromptID, versionID, prompt, config).then(_ => refreshVersions(activePromptID, versionID))
  }

  const publishPrompt = async (projectID: number, endpoint: string, prompt: string, config: RunConfig) => {
    await savePromptAndRefocus()
    await api.publishPrompt(projectID, activePromptID, endpoint, prompt, config).then(setCURLCommand)
  }

  const deleteVersion = async (version: Version) => {
    const versionHasRuns = version.runs.length > 0
    const isLastVersion = versions.length === 1
    const isLastPrompt = isLastVersion && activeProject.prompts.length === 1
    const isLastProject = isLastPrompt && projects.length === 1

    const entity = isLastPrompt ? 'project' : isLastVersion ? 'prompt' : 'version'
    const suffix = versionHasRuns ? ' and all its associated runs' : ''
    setDialogPrompt({
      message: `Are you sure you want to delete this ${entity}${suffix}? This action cannot be undone.`,
      callback: async () => {
        await api.deleteVersion(version.id)
        if (!isLastProject && versions.length > 1) {
          refreshVersions()
        }
        refreshProjects()
      },
      destructive: true,
    })
  }

  return (
    <main className={`flex items-stretch h-screen ${inter.className}`}>
      <ProjectSidebar
        projects={projects}
        activePromptID={activePromptID}
        updateActivePrompt={updateActivePrompt}
        onLogout={refreshData}
        onRefresh={refreshProjectsAndRefocus}
      />
      <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto max-w-prose'>
        <LabeledTextInput placeholder='Filter' value={filter} setValue={setFilter} />
        <VersionTimeline
          versions={versions.filter(versionFilter(filter))}
          activeVersion={activeVersion}
          setActiveVersion={selectActiveVersion}
          activeRun={activeRun}
          setActiveRun={setActiveRun}
          onDelete={deleteVersion}
        />
      </div>
      <div className='flex-1'>
        <Suspense>
          <PromptPanel
            key={activeVersion.id}
            project={activeProject}
            version={activeVersion}
            activeRun={activeRun ?? activeVersion.runs[0]}
            setDirtyVersion={setDirtyVersion}
            onRun={runPrompt}
            onSave={() => savePromptAndRefocus().then()}
            onPublish={publishPrompt}
          />
        </Suspense>
        {curlCommand && (
          <div className='flex flex-col gap-4 px-8 text-black whitespace-pre-wrap'>
            Prompt published. Try out your new API endpoint by running:
            <pre>{curlCommand}</pre>
          </div>
        )}
      </div>
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
    </main>
  )
}
