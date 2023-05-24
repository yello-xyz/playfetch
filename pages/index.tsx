import { getPrompts } from '@/server/datastore'
import PromptBadge from '@/client/promptBadge'
import { Inter } from 'next/font/google'
import { withLoggedInSession } from '@/server/session'
import TextInput from '@/client/textInput'
import { useRouter } from 'next/navigation'
import { Button } from 'flowbite-react'
import api from '@/client/api'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedInSession(async () => ({ props: { prompts: await getPrompts() } }))

export default function Home({ prompts }: { prompts: string[] }) {
  const router = useRouter()

  const addPrompt = async (prompt: string) => {
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
      <TextInput label='Prompt' placeholder='Enter your prompt...' buttonTitle='Add' onSubmit={addPrompt} />
      <Button id='logout' onClick={logout}>
        Log out
      </Button>
    </main>
  )
}
