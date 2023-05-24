import { getPrompts } from '@/server/datastore'
import PromptBadge from '@/client/promptBadge'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import { Button } from 'flowbite-react'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async () => ({ props: { prompts: await getPrompts() } }))

export default function Home({ prompts }: { prompts: string[] }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')

  const addPrompt = async () => {
    await api.addPrompt(prompt)
    router.refresh()
  }

  const logout = async () => {
    await api.logout()
    router.refresh()
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      {prompts.map((prompt, index) => (
        <PromptBadge key={index} prompt={prompt} />
      ))}
      <LabeledTextInput label='Prompt' placeholder='Enter your prompt...' value={prompt} setValue={setPrompt} />
      <Button onClick={addPrompt}>Add Prompt</Button>
      <Button onClick={logout}>Log out</Button>
    </main>
  )
}
