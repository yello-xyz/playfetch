import { getPrompts } from '@/server/datastore'
import AddPromptInput from './addPromptInput'
import PromptBadge from './promptBadge'

export default async function Home() {
  const prompts = await getPrompts()

  return (
    <main className='flex flex-col gap-4 p-10 align-items: flex-start'>
      {prompts.map((prompt, index) => (
        <div key={index} className='flex'>
          <PromptBadge prompt={prompt} />
        </div>
      ))}
      <AddPromptInput />
    </main>
  )
}
