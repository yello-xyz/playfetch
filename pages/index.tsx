import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { ReactNode, useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Badge, Sidebar, Timeline } from 'flowbite-react'
import { Project, Run, Version } from '@/types'
import { HiOutlineFolderAdd } from 'react-icons/hi'
import TagsInput from '@/client/tagsInput'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async ({ req }) => {
  const userID = req.session.user!.id
  let projects = await getProjectsForUser(userID)
  if (projects.length === 0) {
    await addProjectForUser(userID)
    projects = await getProjectsForUser(userID)
  }
  const initialActivePromptID = projects[0].prompts[0].id
  const initialVersions = await getVersionsForPrompt(userID, initialActivePromptID)
  return { props: { projects, initialActivePromptID, initialVersions } }
})

const truncate = (text: string, length: number = 20) =>
  text.length <= length ? text : text.slice(0, length).trim() + '…'

export default function Home({
  projects,
  initialActivePromptID,
  initialVersions,
}: {
  projects: Project[]
  initialActivePromptID: number
  initialVersions: Version[]
}) {
  const router = useRouter()
  const [activePromptID, setActivePromptID] = useState(initialActivePromptID)
  const [versions, setVersions] = useState(initialVersions)
  const [activeVersion, setActiveVersion] = useState<Version>(initialVersions[0])

  const [filter, setFilter] = useState('')
  const filteredVersions = versions.filter(
    version =>
      !filter.length ||
      version.title.toLowerCase().includes(filter.toLowerCase()) ||
      version.tags.toLowerCase().includes(filter.toLowerCase()) ||
      version.prompt.toLowerCase().includes(filter.toLowerCase()) ||
      version.runs.some(run => run.output.toLowerCase().includes(filter.toLowerCase()))
  )

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

  const refreshData = async () => router.replace(router.asPath)

  const refreshVersions = async (promptID: number, focusOnMostRecent = true) => {
    const versions = await api.getPromptVersions(promptID)
    setVersions(versions)
    if (focusOnMostRecent) {
      setActiveVersion(versions[0])
    }
  }

  const addProject = async () => {
    const promptID = await api.addProject()
    await refreshData()
    updateActivePrompt(promptID)
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    await refreshData()
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
    await refreshData()
    await refreshVersions(activePromptID, focusOnNewlySaved)
  }

  const runPrompt = async () => {
    let versionID = activeVersion.id
    if (isDirty) {
      versionID = await api.updatePrompt(activePromptID, prompt, title, tags, activeVersion.id)
      await refreshData()
    }
    await api.runPrompt(activePromptID, versionID, prompt)
    await refreshVersions(activePromptID, isDirty)
  }

  const logout = async () => {
    await api.logout()
    await refreshData()
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
        <VersionTimeline versions={filteredVersions} onSelect={updateActiveVersion} />
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

const formatDate = (timestamp: string) => {
  const dateString = new Date(timestamp).toLocaleDateString()
  const timeString = new Date(timestamp).toLocaleTimeString()
  const todayString = new Date().toLocaleDateString()
  return dateString === todayString ? timeString : `${dateString} ${timeString}`
}

function VersionTimeline({ versions, onSelect }: { versions: Version[]; onSelect: (version: Version) => void }) {
  return (
    <Timeline>
      {versions.map((version, index) => (
        <Timeline.Item key={index} className='cursor-pointer' onClick={() => onSelect(version)}>
          <Timeline.Point />
          <Timeline.Content>
            <Timeline.Time>{formatDate(version.timestamp)}</Timeline.Time>
            <Timeline.Title className='flex items-center gap-2'>
              {version.title}
              {version.tags
                .split(', ')
                .map(tag => tag.trim())
                .filter(tag => tag.length)
                .map((tag, tagIndex) => (
                  <Badge key={tagIndex}>{tag}</Badge>
                ))}
            </Timeline.Title>
            <Timeline.Body>
              {version.prompt}
              <RunTimeline runs={version.runs} />
            </Timeline.Body>
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline>
  )
}

function RunTimeline({ runs }: { runs: Run[] }) {
  return (
    <Timeline>
      {runs.map((run, index) => (
        <Timeline.Item key={index} className='cursor-pointer'>
          <Timeline.Point />
          <Timeline.Content>
            <Timeline.Time>{formatDate(run.timestamp)}</Timeline.Time>
            <Timeline.Body>{run.output}</Timeline.Body>
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline>
  )
}
