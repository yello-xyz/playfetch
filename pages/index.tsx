import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { MouseEvent, useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Badge, Sidebar, Timeline } from 'flowbite-react'
import { Project, Run, Version } from '@/types'
import { HiOutlineFolderAdd } from 'react-icons/hi'
import TagsInput from '@/client/tagsInput'
import simplediff from 'simplediff'
import { HiOutlineSparkles, HiPlay, HiOutlineTrash } from 'react-icons/hi'
import ModalDialog, { DialogPrompt } from '@/client/modalDialog'
import { BuildUniqueName, FormatDate, Truncate } from '@/common/formatting'
import ProjectNameDialog, { ProjectDialogPrompt } from '@/client/projectNameDialog'

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
        <Sidebar.Items>
          {projects.map((project, projectIndex) => (
            <Sidebar.Collapse key={projectIndex} label={project.name}>
              <Sidebar.Item>
                <PendingButton onClick={() => addPrompt(project.id)}>Add Prompt</PendingButton>
              </Sidebar.Item>
              {project.prompts.map((prompt, promptIndex) => (
                <Sidebar.Item
                  className='cursor-pointer'
                  key={promptIndex}
                  active={activePromptID === prompt.id}
                  onClick={() => updateActivePrompt(prompt.id)}>
                  {Truncate(prompt.name, 20)}
                </Sidebar.Item>
              ))}
            </Sidebar.Collapse>
          ))}
        </Sidebar.Items>
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

function PromptPanel({
  version,
  setDirtyVersion,
  onRun,
  onSave,
}: {
  version: Version
  setDirtyVersion: (version?: Version) => void
  onRun: () => void
  onSave: () => void
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [title, setTitle] = useState(version.title)
  const [tags, setTags] = useState(version.tags)
  const [isDirty, setDirty] = useState(false)

  const update = (prompt: string, title: string, tags: string) => {
    setPrompt(prompt)
    setTitle(title)
    setTags(tags)
    const isDirty = prompt !== version.prompt || title !== version.title || tags !== version.tags
    setDirty(isDirty)
    setDirtyVersion(isDirty ? { ...version, prompt, title, tags } : undefined)
  }

  const updateTitle = (title: string) => update(prompt, title, tags)
  const updateTags = (tags: string) => update(prompt, title, tags)
  const updatePrompt = (prompt: string) => update(prompt, title, tags)

  return (
    <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto text-gray-500 max-w-prose'>
      <div className='self-stretch'>
        <LabeledTextInput
          id='prompt'
          multiline
          label='Prompt'
          placeholder='Enter your prompt...'
          value={prompt}
          setValue={updatePrompt}
        />
      </div>
      <LabeledTextInput id='title' label='Title (optional)' value={title} setValue={updateTitle} />
      <TagsInput label='Tags (optional)' tags={tags} setTags={updateTags} />
      <div className='flex gap-2'>
        <PendingButton disabled={!prompt.length} onClick={onRun}>
          Run
        </PendingButton>
        <PendingButton disabled={!isDirty} onClick={onSave}>
          Save
        </PendingButton>
      </div>
    </div>
  )
}

const classNameForComparison = (state: '=' | '-' | '+') => {
  switch (state) {
    case '=':
      return ''
    case '-':
      return 'text-red-600 line-through'
    case '+':
      return 'text-green-600 underline'
  }
}

const renderComparison = (previous: string, current: string) =>
  simplediff
    .diff(previous.split(/[ ]+/), current.split(/[ ]+/))
    .map((part: { 0: '=' | '-' | '+'; 1: string[] }, index: number) => (
      <span key={index}>
        <span className={classNameForComparison(part[0])}>{part[1].join(' ')}</span>{' '}
      </span>
    ))

const customPointTheme = {
  marker: {
    icon: {
      wrapper: 'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white',
    },
  },
}

function VersionTimeline({
  versions,
  activeVersion,
  activeRun,
  setActiveVersion,
  setActiveRun,
  onDelete,
}: {
  versions: Version[]
  activeVersion: Version
  activeRun?: Run
  setActiveVersion: (version: Version) => void
  setActiveRun: (run?: Run) => void
  onDelete: (version: Version) => void
}) {
  const previousVersion = versions.find(version => version.id === activeVersion.previousID)
  const isActiveVersion = (item: Version | Run) => item.id === activeVersion.id
  const renderPrompt = (version: Version) =>
    previousVersion && isActiveVersion(version)
      ? renderComparison(previousVersion.prompt, version.prompt)
      : version.prompt
  const isVersion = (item: Version | Run): item is Version => (item as Version).runs !== undefined
  const toVersion = (item: Version | Run): Version =>
    isVersion(item) ? item : versions.find(version => version.runs.map(run => run.id).includes(item.id))!
  const isPreviousVersion = (item: Version | Run) => !!previousVersion && item.id === previousVersion.id

  const deleteVersion = async (event: MouseEvent, version: Version) => {
    event.stopPropagation()
    onDelete(version)
  }

  const select = async (item: Version | Run) => {
    setActiveVersion(toVersion(item))
    setActiveRun(isVersion(item) ? undefined : item)
  }

  return (
    <Timeline>
      {versions
        .flatMap(version => [version, ...version.runs])
        .map((item, index, items) => (
          <Timeline.Item key={index} className='cursor-pointer' onClick={() => select(item)}>
            <Timeline.Point icon={isVersion(item) ? HiOutlineSparkles : HiPlay} theme={customPointTheme} />
            <Timeline.Content>
              <Timeline.Time className='flex gap-2'>
                {isActiveVersion(item) && '⮕ '}
                {isPreviousVersion(item) && '⬅ '}
                {FormatDate(item.timestamp, index > 0 ? items[index - 1].timestamp : undefined)}
                {isVersion(item) && <HiOutlineTrash onClick={event => deleteVersion(event, item)} />}
              </Timeline.Time>
              {isVersion(item) && (
                <Timeline.Title className='flex items-center gap-2'>
                  {item.title}
                  {item.tags
                    .split(', ')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length)
                    .map((tag, tagIndex) => (
                      <Badge key={tagIndex}>{tag}</Badge>
                    ))}
                </Timeline.Title>
              )}
              <Timeline.Body className={isVersion(item) ? '' : 'italic'}>
                {isVersion(item)
                  ? renderPrompt(item)
                  : item.id === activeRun?.id
                  ? item.output
                  : Truncate(item.output, 200)}
              </Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        ))}
    </Timeline>
  )
}
