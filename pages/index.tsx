import { getProjectsForUser } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useEffect, useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Sidebar } from 'flowbite-react'
import { Project, Prompt } from '@/types'
import { HiOutlineFolderAdd } from 'react-icons/hi'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async ({ req }) => ({
  props: { projects: await getProjectsForUser(req.session.user!.id) },
}))

export default function Home({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [activePromptID, setActivePromptID] = useState(projects[0].prompts[0].id)

  useEffect(() => {
    setPrompt(projects.flatMap(project => project.prompts).find(prompt => prompt.id === activePromptID)!.prompt)
  }, [activePromptID])

  const addProject = async () => {
    await api.addProject()
    router.refresh()
  }

  const addPrompt = async (projectID: number) => {
    await api.addPrompt(projectID)
    router.refresh()
  }

  const logout = async () => {
    await api.logout()
    router.refresh()
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
              <PendingButton onClick={() => addPrompt(project.id)}>Add Prompt</PendingButton>
              {project.prompts.map((prompt, promptIndex) => (
                <Sidebar.Item key={promptIndex} onClick={() => setActivePromptID(prompt.id)}>
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
          <PendingButton onClick={() => {}}>Save Prompt</PendingButton>
        </div>
      </div>
    </main>
  )
}
