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
import { BuildUniqueName, FormatDate } from '@/common/formatting'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async ({ req }) => {
  const userID = req.session.user!.id
  let initialProjects = await getProjectsForUser(userID)
  if (initialProjects.length === 0) {
    await addProjectForUser(userID)
    initialProjects = await getProjectsForUser(userID)
  }
  const initialActivePromptID = initialProjects[0].prompts[0].id
  const initialVersions = await getVersionsForPrompt(userID, initialActivePromptID)
  const initialActiveVersion = initialVersions[0]
  return { props: { initialProjects, initialActivePromptID, initialVersions, initialActiveVersion } }
})

const truncate = (text: string, length: number = 20) =>
  text.length <= length ? text : text.slice(0, length).trim() + '…'

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

  const [filter, setFilter] = useState('')
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [newProjectName, setNewProjectName] = useState<string>()

  const [prompt, setPrompt] = useState<string>(activeVersion.prompt)
  const [title, setTitle] = useState(activeVersion.title)
  const [tags, setTags] = useState(activeVersion.tags)
  const [previousActiveVersionID, setPreviousActiveID] = useState<number>(activeVersion.id)
  if (activeVersion.id !== previousActiveVersionID) {
    setPrompt(activeVersion.prompt)
    setTitle(activeVersion.title)
    setTags(activeVersion.tags)
    setPreviousActiveID(activeVersion.id)
  }
  const isDirty = activeVersion.prompt !== prompt || title !== activeVersion.title || tags !== activeVersion.tags

  const addProject = async () => {
    setNewProjectName(
      BuildUniqueName(
        'New Project',
        projects.map(project => project.name)
      )
    )
    setDialogPrompt({
      message: 'Add a new project',
      onConfirm: async () => {
        const promptID = await api.addProject()
        await refreshProjects()
        updateActivePrompt(promptID)
      },
      onDismiss: () => setNewProjectName(undefined),
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
    if (version.id !== activeVersion.id) {
      if (isDirty) {
        savePrompt().then(_ => refreshVersions())
      }
      setActiveVersion(version)
    }
  }

  const refreshProjects = async () => {
    const hasActivePrompt = (project: Project) => project.prompts.some(prompt => prompt.id === activePromptID)
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
      setActiveVersion(focusedVersion ?? newVersions[0])
    }
  }

  const savePrompt = async (focusOnSavedVersion = false) => {
    if (!isDirty) {
      return activeVersion.id
    }
    const versionID = await api.updatePrompt(activePromptID, prompt, title, tags, activeVersion.id)
    refreshProjects()
    if (focusOnSavedVersion) {
      refreshVersions(activePromptID, versionID)
    }
    return versionID
  }

  const runPrompt = async () => {
    const versionID = await savePrompt(true)
    await api.runPrompt(activePromptID, versionID, prompt).then(_ => refreshVersions())
  }

  const logout = async () => {
    await api.logout()
    router.replace(router.asPath)
  }

  const deleteVersion = async (version: Version) => {
    setDialogPrompt({
      message:
        'Are you sure you want to delete this version and all its associated runs? ' + 'This action cannot be undone.',
      onConfirm: async () => {
        await api.deleteVersion(version.id)
        if (versions.length > 1) {
          refreshVersions()
        } else {
          refreshProjects()
        }
      },
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
                  {truncate(prompt.name)}
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
          onSelect={updateActiveVersion}
          onDelete={deleteVersion}
        />
      </div>
      <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto text-gray-500 max-w-prose'>
        <div className='self-stretch'>
          <LabeledTextInput
            id='prompt'
            multiline
            label='Prompt'
            placeholder='Enter your prompt...'
            value={prompt}
            setValue={setPrompt}
          />
        </div>
        <LabeledTextInput id='title' label='Title (optional)' value={title} setValue={setTitle} />
        <TagsInput label='Tags (optional)' tags={tags} setTags={setTags} />
        <div className='flex gap-2'>
          <PendingButton disabled={!prompt.length} onClick={runPrompt}>
            Run
          </PendingButton>
          <PendingButton disabled={!isDirty} onClick={() => savePrompt(true).then()}>
            Save
          </PendingButton>
        </div>
      </div>
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt}>
        {newProjectName !== undefined && (
          <LabeledTextInput id='name' label='Project name:' value={newProjectName} setValue={setNewProjectName} />
        )}
      </ModalDialog>
    </main>
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
  onSelect,
  onDelete,
}: {
  versions: Version[]
  activeVersion: Version
  onSelect: (version: Version) => void
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

  return (
    <Timeline>
      {versions
        .flatMap(version => [version, ...version.runs])
        .map((item, index, items) => (
          <Timeline.Item key={index} className='cursor-pointer' onClick={() => onSelect(toVersion(item))}>
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
                {isVersion(item) ? renderPrompt(item) : item.output}
              </Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        ))}
    </Timeline>
  )
}
