import { getProjectsForUser } from '@/server/datastore'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Accordion } from 'flowbite-react'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async ({ req }) => ({
  props: { projects: await getProjectsForUser(req.session.user!.id) },
}))

export default function Home({ projects }: { projects: { id: number; name: string }[] }) {
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
      <PendingButton onClick={addProject}>Add New Project</PendingButton>
      <Accordion alwaysOpen={true}>
        {projects.map((project, index) => (
          <Accordion.Panel key={index} setOpen={() => setActiveProjectID(project.id)}>
            <Accordion.Title>{project.name}</Accordion.Title>
          </Accordion.Panel>
        ))}
      </Accordion>
      <div className='self-stretch'>
        <LabeledTextInput label='Prompt' placeholder='Enter your prompt...' value={prompt} setValue={setPrompt} />
      </div>
      <PendingButton onClick={addPrompt}>Add Prompt</PendingButton>
      <PendingButton onClick={logout}>Log out</PendingButton>
    </main>
  )
}
