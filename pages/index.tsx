import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Sidebar } from 'flowbite-react'
import { Project, Run, Version } from '@/types'
import { HiOutlineFolderAdd } from 'react-icons/hi'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import { BuildUniqueName } from '@/common/formatting'
import ProjectNameDialog, { ProjectDialogPrompt } from '@/client/projectNameDialog'
import PromptPanel from '@/client/promptPanel'
import VersionTimeline from '@/client/versionTimeline'
import ProjectItems from '@/client/projectItems'

const inter = Inter({ subsets: ['latin'] })

const defaultNewProjectName = 'New Project'

export const getServerSideProps = withLoggedInSession(async ({ req }) => {
  const userID = req.session.user!.id
  let initialProjects = await getProjectsForUser(userID)
  if (initialProjects.length === 0) {
    await addProjectForUser(userID, defaultNewProjectName)
    initialProjects = await getProjectsForUser(userID)
  }
  const initialActivePromptID = initialProjects[0].prompts[0].id
  const initialVersions = await getVersionsForPrompt(userID, initialActivePromptID)
  const initialActiveVersion = initialVersions[0]
  return { props: { initialProjects, initialActivePromptID, initialVersions, initialActiveVersion } }
})

const versionFilter = (filter: string) => (version: Version) => {
  const lowerCaseFilter = filter.toLowerCase()
  return (
    version.title.toLowerCase().includes(lowerCaseFilter) ||
    version.tags.toLowerCase().includes(lowerCaseFilter) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

export default function Home({
  initialProjects,
  initialActivePromptID,
  initialVersions,
  initialActiveVersion,
}: {
  initialProjects: Project[]
  initialActivePromptID: number
  initialVersions: Version[]
  initialActiveVersion: Version
}) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [activePromptID, setActivePromptID] = useState(initialActivePromptID)
  const [versions, setVersions] = useState(initialVersions)
  const [activeVersion, setActiveVersion] = useState(initialActiveVersion)
  const [activeRun, setActiveRun] = useState<Run>()
  const [dirtyVersion, setDirtyVersion] = useState<Version>()

  const [filter, setFilter] = useState('')
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [projectDialogPrompt, setProjectDialogPrompt] = useState<ProjectDialogPrompt>()

  const uniqueProjectName = BuildUniqueName(
    defaultNewProjectName,
    projects.map(project => project.name)
  )

  const addProject = async () => {
    setProjectDialogPrompt({
      message: 'Add a new project',
      callback: async (name: string) => {
        const promptID = await api.addProject(name)
        await refreshProjects()
        updateActivePrompt(promptID)
      },
    })
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    await refreshProjects()
    updateActivePrompt(promptID)
  }

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

  const refreshProjects = async () => {
    const oldIndex = projects.findIndex(hasActivePrompt)
    const newProjects = await api.getProjects()
    setProjects(newProjects)
    if (!newProjects.some(hasActivePrompt)) {
      const newIndex = Math.max(0, Math.min(newProjects.length - 1, oldIndex))
      updateActivePrompt(newProjects[newIndex].prompts[0].id)
    }
  }

  const refreshVersions = async (promptID = activePromptID, focusID = activeVersion.id) => {
    const newVersions = await api.getVersions(promptID)
    setVersions(newVersions)
    const focusedVersion = newVersions.find(version => version.id === focusID)
    if (!focusedVersion || focusID !== activeVersion.id) {
      updateActiveVersion(focusedVersion ?? newVersions[0])
    }
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

  const runPrompt = async () => {
    const versionID = await savePromptAndRefocus()
    const prompt = dirtyVersion?.prompt ?? activeVersion.prompt
    await api.runPrompt(activePromptID, versionID, prompt).then(_ => refreshVersions())
  }

  const logout = async () => {
    await api.logout()
    router.replace(router.asPath)
  }

  const deleteVersion = async (version: Version) => {
    const versionHasRuns = version.runs.length > 0
    const isLastVersion = versions.length === 1
    const activeProject = projects.find(hasActivePrompt)
    const isLastPrompt = isLastVersion && activeProject && activeProject.prompts.length === 1
    const isLastProject = isLastPrompt && projects.length === 1

    const entity = isLastPrompt ? 'project' : isLastVersion ? 'prompt' : 'version'
    const suffix = versionHasRuns ? ' and all its associated runs' : ''
    setDialogPrompt({
      message: `Are you sure you want to delete this ${entity}${suffix}? This action cannot be undone.`,
      callback: async () => {
        await api.deleteVersion(version.id)
        if (isLastProject) {
          await api.addProject(defaultNewProjectName)
        }
        if (versions.length > 1) {
          refreshVersions()
        }
        refreshProjects()
      },
      destructive: true,
    })
  }

  return (
    <main className={`flex items-stretch h-screen ${inter.className}`}>
      <Sidebar>
        <div className='flex flex-col gap-4'>
          <PendingButton onClick={logout}>Log out</PendingButton>
          <PendingButton onClick={addProject}>
            <HiOutlineFolderAdd className='w-5 h-5 mr-2' />
            Add New Project
          </PendingButton>
        </div>
        <ProjectItems
          projects={projects}
          activePromptID={activePromptID}
          addPrompt={addPrompt}
          updateActivePrompt={updateActivePrompt}
        />
      </Sidebar>
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
      <PromptPanel
        key={activeVersion.id}
        version={activeVersion}
        setDirtyVersion={setDirtyVersion}
        onRun={runPrompt}
        onSave={() => savePromptAndRefocus().then()}
      />
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
      <ProjectNameDialog
        key={uniqueProjectName}
        suggestedProjectName={uniqueProjectName}
        prompt={projectDialogPrompt}
        setPrompt={setProjectDialogPrompt}
      />
    </main>
  )
}
