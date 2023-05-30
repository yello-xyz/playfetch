import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Sidebar, Timeline } from 'flowbite-react'
import { Project, Run, Version } from '@/types'
import { HiOutlineFolderAdd } from 'react-icons/hi'

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
  const [activeVersion, setActiveVersion] = useState<Version | undefined>(initialVersions[0])

  const activeTimestamp = activeVersion ? new Date(activeVersion.timestamp) : undefined
  const newerVersions = versions.filter(version => activeTimestamp && new Date(version.timestamp) > activeTimestamp)
  const olderVersions = activeTimestamp
    ? versions.filter(version => new Date(version.timestamp) <= activeTimestamp)
    : versions.slice(1)

  const activePrompt = activeVersion
    ? activeVersion.prompt
    : projects.flatMap(project => project.prompts).find(prompt => prompt.id === activePromptID)!.prompt

  const [prompt, setPrompt] = useState<string>(activePrompt)
  const activeItemID = activeVersion ? activeVersion.id : activePromptID
  const [previousActiveItemID, setPreviousActiveID] = useState<number>(activeItemID)
  if (activeItemID !== previousActiveItemID) {
    setPrompt(activePrompt)
    setPreviousActiveID(activeItemID)
  }
  const isPromptDirty = activePrompt !== prompt

  const updateActivePrompt = (promptID: number) => {
    if (promptID !== activePromptID) {
      savePromptIfNeeded()
      setActivePromptID(promptID)
      setActiveVersion(undefined)
      setVersions([])
      api.getPromptVersions(promptID).then(versions => {
        setVersions(versions)
        setActiveVersion(versions[0])
      })
    }
  }

  const updateActiveVersion = (version: Version) => {
    savePromptIfNeeded()
    setActiveVersion(version)
  }

  const refreshData = async () => router.replace(router.asPath)

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
    if (isPromptDirty) {
      savePrompt(false)
    }
  }

  const overwritePrompt = () => savePrompt(true, activeVersion!.id)

  const refreshVersions = async (focusOnMostRecent = true) => {
    const versions = await api.getPromptVersions(activePromptID)
    setVersions(versions)
    if (focusOnMostRecent) {
      setActiveVersion(versions[0])
    }
  }

  const savePrompt = async (focusOnNewlySaved = true, versionID?: number) => {
    await api.updatePrompt(activePromptID, prompt, versionID)
    await refreshData()
    await refreshVersions(focusOnNewlySaved)
  }

  const runPrompt = async () => {
    const versionID = isPromptDirty ? undefined : activeVersion?.id
    await api.runPrompt(activePromptID, prompt, versionID)
    await refreshVersions(isPromptDirty)
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
                  {prompt.prompt}
                </Sidebar.Item>
              ))}
            </Sidebar.Collapse>
          ))}
        </Sidebar.Items>
      </Sidebar>
      <div className='flex flex-col gap-4 p-8 overflow-y-auto grow max-w-prose'>
        {activeVersion && <VersionTimeline versions={newerVersions} onSelect={updateActiveVersion} />}
        <div className='self-stretch'>
          <LabeledTextInput
            multiline
            label='Prompt'
            placeholder='Enter your prompt...'
            value={prompt}
            setValue={setPrompt}
          />
        </div>
        <div className='flex gap-2'>
          <PendingButton disabled={!isPromptDirty} onClick={savePrompt}>
            Save
          </PendingButton>
          {activeVersion && (
            <PendingButton disabled={!isPromptDirty} onClick={overwritePrompt}>
              Overwrite
            </PendingButton>
          )}
          <PendingButton disabled={!prompt.length} onClick={runPrompt}>
            Run
          </PendingButton>
        </div>
        <VersionTimeline versions={olderVersions} onSelect={updateActiveVersion} />
      </div>
    </main>
  )
}

function VersionTimeline({ versions, onSelect }: { versions: Version[]; onSelect: (version: Version) => void }) {
  const formatDate = (timestamp: string) =>
    `${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`

  return (
    <Timeline>
      {versions.map((version, index) => (
        <Timeline.Item key={index} className='cursor-pointer' onClick={() => onSelect(version)}>
          <Timeline.Point />
          <Timeline.Content>
            <Timeline.Time>{formatDate(version.timestamp)}</Timeline.Time>
            {(version as any).title && <Timeline.Title></Timeline.Title>}
            <Timeline.Body>{version.prompt}<RunTimeline runs={version.runs} /></Timeline.Body>
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline>
  )
}

function RunTimeline({ runs }: { runs: Run[] }) {
  const formatDate = (timestamp: string) =>
    `${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`

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
