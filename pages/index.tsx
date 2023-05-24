import { getPrompts } from '@/server/datastore'
import AddPromptInput from '@/client/addPromptInput'
import PromptBadge from '@/client/promptBadge'
import { Inter } from 'next/font/google'
import { withSession } from '@/server/session'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withSession(async function getServerSideProps({ req }) {
  if (req.session.user) {
    return { props: { prompts: await getPrompts() } }
  } else {
    return { redirect: { destination: '/login', permanent: false } }
  }
})

export default function Home({ prompts }: { prompts: string[] }) {
  return (
    <main className={`flex flex-col gap-4 p-10 align-items: flex-start ${inter.className}`}>
      {prompts.map((prompt, index) => (
        <div key={index} className='flex'>
          <PromptBadge prompt={prompt} />
        </div>
      ))}
      <AddPromptInput />
    </main>
  )
}
