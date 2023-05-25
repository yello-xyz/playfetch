import { getProjectsForUser } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Sidebar } from 'flowbite-react'
import { Project } from '@/types'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async ({ req }) => ({
  props: { projects: await getProjectsForUser(req.session.user!.id) },
}))

export default function Home({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [activeProjectID, setActiveProjectID] = useState(projects[0]?.id)

  const addProject = async () => {
    await api.addProject()
    router.refresh()
  }

  const addPrompt = async () => {
    await api.addPrompt(activeProjectID, prompt)
    router.refresh()
  }

  const logout = async () => {
    await api.logout()
    router.refresh()
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <Sidebar>
      <PendingButton onClick={addProject}>Add New Project</PendingButton>
        <Sidebar.Items>
          {projects.map((project, index) => (
            <Sidebar.Collapse
              key={index}
              label={project.name}
              open={project.id === activeProjectID}
              onClick={() => setActiveProjectID(project.id)}>
              {project.prompts.map((prompt, promptIndex) => (
                <Sidebar.Item key={promptIndex}>{prompt.prompt}</Sidebar.Item>
              ))}
            </Sidebar.Collapse>
          ))}
        </Sidebar.Items>
      </Sidebar>
      <div className='self-stretch'>
        <LabeledTextInput label='Prompt' placeholder='Enter your prompt...' value={prompt} setValue={setPrompt} />
      </div>
      <PendingButton onClick={addPrompt}>Add Prompt</PendingButton>
      <PendingButton onClick={logout}>Log out</PendingButton>
    </main>
  )
}
