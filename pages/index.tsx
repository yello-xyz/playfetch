import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Sidebar, Timeline } from 'flowbite-react'
import { Project, Version } from '@/types'
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
  const [activeVersionID, setActiveVersionID] = useState<number>()

  const activeVersion = activeVersionID ? versions.find(version => version.id === activeVersionID) : undefined
  const activeTimestamp = activeVersion ? new Date(activeVersion.timestamp) : undefined
  const newerVersions = versions.filter(version => activeTimestamp && new Date(version.timestamp) > activeTimestamp)
  const olderVersions = activeTimestamp
    ? versions.filter(version => new Date(version.timestamp) < activeTimestamp)
    : versions.slice(1)

  const activePrompt = activeVersion
    ? activeVersion.prompt
    : projects.flatMap(project => project.prompts).find(prompt => prompt.id === activePromptID)!.prompt

  const updateActivePrompt = (promptID: number) => {
    setActivePromptID(promptID)
    setActiveVersionID(undefined)
    if (promptID !== activePromptID) {
      setVersions([])
    }
    api.getPromptVersions(promptID).then(setVersions)
  }

  const updateActiveVersion = (version: Version) => {
    setActiveVersionID(version.id)
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

  const updatePrompt = async (prompt: string) => {
    if (prompt) {
      await api.updatePrompt(activePromptID, prompt)
      await refreshData()
      updateActivePrompt(activePromptID)
    }
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
      <div className='flex flex-col gap-4 p-8 grow'>
        {activeVersionID && <VersionTimeline versions={newerVersions} onSelect={updateActiveVersion} />}
        <PromptPanel key={activePrompt} initialPrompt={activePrompt} onSave={updatePrompt} />
        <VersionTimeline versions={olderVersions} onSelect={updateActiveVersion} />
      </div>
    </main>
  )
}

function PromptPanel({ initialPrompt, onSave }: { initialPrompt: string; onSave: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState<string>(initialPrompt)

  return (
    <>
      <div className='self-stretch'>
        <LabeledTextInput label='Prompt' placeholder='Enter your prompt...' value={prompt} setValue={setPrompt} />
      </div>
      <div>
        <PendingButton disabled={prompt === initialPrompt} onClick={() => onSave(prompt)}>
          Save Prompt
        </PendingButton>
      </div>
    </>
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
            <Timeline.Body>{version.prompt}</Timeline.Body>
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline>
  )
}
