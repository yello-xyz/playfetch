import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Badge, Sidebar, Timeline } from 'flowbite-react'
import { Project, Run, Version } from '@/types'
import { HiOutlineFolderAdd } from 'react-icons/hi'
import TagsInput from '@/client/tagsInput'
import simplediff from 'simplediff'

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
  const isPromptDirty = activeVersion.prompt !== prompt
  const isDirty = isPromptDirty || title !== activeVersion.title || tags !== activeVersion.tags

  const updateActivePrompt = (promptID: number) => {
    if (promptID !== activePromptID) {
      savePromptIfNeeded()
      setActivePromptID(promptID)
      refreshVersions(promptID)
    }
  }

  const updateActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      savePromptIfNeeded()
      setActiveVersion(version)
    }
  }

  const refreshProjects = () => api.getProjects().then(setProjects)

  const refreshVersions = async (promptID: number, focusOnMostRecent = true) => {
    const versions = await api.getPromptVersions(promptID)
    setVersions(versions)
    if (focusOnMostRecent) {
      setActiveVersion(versions[0])
    }
  }

  const addProject = async () => {
    const promptID = await api.addProject()
    await refreshProjects()
    updateActivePrompt(promptID)
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    await refreshProjects()
    updateActivePrompt(promptID)
  }

  const savePromptIfNeeded = () => {
    if (isDirty) {
      savePrompt(false)
    }
  }

  const overwritePrompt = () => savePrompt(true, activeVersion.id)

  const savePrompt = async (focusOnNewlySaved = true, versionID?: number) => {
    await api.updatePrompt(activePromptID, prompt, title, tags, activeVersion.id, versionID)
    refreshProjects()
    refreshVersions(activePromptID, focusOnNewlySaved)
  }

  const runPrompt = async () => {
    let versionID = activeVersion.id
    if (isDirty) {
      versionID = await api.updatePrompt(activePromptID, prompt, title, tags, activeVersion.id)
      refreshProjects()
    }
    await api.runPrompt(activePromptID, versionID, prompt)
    await refreshVersions(activePromptID, isDirty)
  }

  const logout = async () => {
    await api.logout()
    router.replace(router.asPath)
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
          <PendingButton disabled={!isDirty} onClick={savePrompt}>
            Save
          </PendingButton>
          <PendingButton
            disabled={!isDirty || (isPromptDirty && !!activeVersion.runs.length)}
            onClick={overwritePrompt}>
            Overwrite
          </PendingButton>
          <PendingButton disabled={!prompt.length} onClick={runPrompt}>
            Run
          </PendingButton>
        </div>
      </div>
    </main>
  )
}

const formatDate = (timestamp: string, previousTimestamp?: string) => {
  const dateString = new Date(timestamp).toLocaleDateString()
  const timeString = new Date(timestamp).toLocaleTimeString()
  const previousDateString = previousTimestamp ? new Date(previousTimestamp).toLocaleDateString() : undefined
  const todayString = new Date().toLocaleDateString()
  return dateString === previousDateString || dateString === todayString ? timeString : `${dateString} ${timeString}`
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

function VersionTimeline({
  versions,
  activeVersion,
  onSelect,
}: {
  versions: Version[]
  activeVersion: Version
  onSelect: (version: Version) => void
}) {
  const previousVersion = versions.find(version => version.id === activeVersion.previousID)
  const renderPrompt = (version: Version) =>
    previousVersion && version.id === activeVersion.id
      ? renderComparison(previousVersion.prompt, version.prompt)
      : version.prompt
  const isVersion = (item: Version | Run): item is Version => (item as Version).runs !== undefined
  const toVersion = (item: Version | Run): Version =>
    isVersion(item) ? item : versions.find(version => version.runs.map(run => run.id).includes(item.id))!

  return (
    <Timeline>
      {versions
        .flatMap(version => [version, ...version.runs])
        .map((item, index, items) => (
          <Timeline.Item key={index} className='cursor-pointer' onClick={() => onSelect(toVersion(item))}>
            <Timeline.Point />
            <Timeline.Content>
              <Timeline.Time>
                {formatDate(item.timestamp, index > 0 ? items[index - 1].timestamp : undefined)}
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
              <Timeline.Body>{isVersion(item) ? renderPrompt(item) : item.output}</Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        ))}
    </Timeline>
  )
}
