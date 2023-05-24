import { getPrompts } from '@/server/datastore'
import PromptBadge from '@/client/promptBadge'
import { Inter } from 'next/font/google'
import { withSession } from '@/server/session'
import TextInput from '@/client/textInput'
import { useRouter } from 'next/navigation'
import { Button } from 'flowbite-react'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withSession(async function getServerSideProps({ req }) {
  if (req.session.user) {
    return { props: { prompts: await getPrompts() } }
  } else {
    return { redirect: { destination: '/login', permanent: false } }
  }
})

export default function Home({ prompts }: { prompts: string[] }) {
  const router = useRouter()

  const addPrompt = async (prompt: string) => {
    await fetch(`/api/addPrompt?prompt=${prompt}`)
    router.refresh()
  }

  const logout = async () => {
    await fetch(`/api/logout`)
    router.refresh()
  }

  return (
    <main className={`flex flex-col gap-4 p-10 align-items: flex-start ${inter.className}`}>
      {prompts.map((prompt, index) => (
        <div key={index} className='flex'>
          <PromptBadge prompt={prompt} />
        </div>
      ))}
      <TextInput label='Prompt' placeholder='Enter your prompt...' buttonTitle='Add' onSubmit={addPrompt} />
      <div>
        <Button onClick={logout}>Log out</Button>
      </div>
    </main>
  )
}
