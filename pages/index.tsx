import { addProjectForUser, getProjectsForUser, getVersionsForPrompt } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/router'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useEffect, useState } from 'react'
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
  const [prompt, setPrompt] = useState('')
  const [activePromptID, setActivePromptID] = useState(initialActivePromptID)
  const [versions, setVersions] = useState(initialVersions)

  const getActivePrompt = () =>
    projects.flatMap(project => project.prompts).find(prompt => prompt.id === activePromptID)!

  useEffect(() => {
    api.getPromptVersions(activePromptID).then(setVersions)
    setPrompt(getActivePrompt().prompt)
  }, [activePromptID])

  const refreshData = async () => router.replace(router.asPath)

  const addProject = async () => {
    const promptID = await api.addProject()
    await refreshData()
    setActivePromptID(promptID)
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    await refreshData()
    setActivePromptID(promptID)
  }

  const updatePrompt = async () => {
    await api.updatePrompt(activePromptID, prompt)
    await refreshData()
    setVersions(initialVersions)
  }

  const logout = async () => {
    await api.logout()
    await refreshData()
  }

  const formatDate = (timestamp: string) =>
    `${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`

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
                  onClick={() => setActivePromptID(prompt.id)}>
                  {prompt.prompt}
                </Sidebar.Item>
              ))}
            </Sidebar.Collapse>
          ))}
        </Sidebar.Items>
      </Sidebar>
      <div className='flex flex-col gap-4 p-8 grow'>
        <div className='self-stretch'>
          <LabeledTextInput label='Prompt' placeholder='Enter your prompt...' value={prompt} setValue={setPrompt} />
        </div>
        <div>
          <PendingButton disabled={prompt === getActivePrompt().prompt} onClick={updatePrompt}>
            Save Prompt
          </PendingButton>
        </div>
        <Timeline>
          {versions.map((version, index) => (
            <Timeline.Item key={index}>
              <Timeline.Point />
              <Timeline.Content>
                <Timeline.Time>{formatDate(version.timestamp)}</Timeline.Time>
                {(version as any).title && <Timeline.Title></Timeline.Title>}
                <Timeline.Body>{version.prompt}</Timeline.Body>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </main>
  )
}
