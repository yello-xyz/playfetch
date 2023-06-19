import { Project, Prompt } from '@/types'
import projectIcon from '@/public/project.svg'
import addIcon from '@/public/add.svg'

export default function TopBar({
  projects = [],
  activeProjectID,
  activePrompt,
  onAddPrompt,
}: {
  projects?: Project[]
  activeProjectID: number | null | undefined
  activePrompt?: Prompt
  onAddPrompt: (projectID: number | null) => void
}) {
  const projectName = projects.find(p => p.id === activeProjectID)?.name
  const promptProjectName = projects.find(p => p.id === activePrompt?.projectID)?.name

  return (
    <div className='flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200'>
      <div className='flex gap-1 text-base font-medium justify-self-start'>
        {(projectName || promptProjectName) && <img className='w-6 h-6' src={projectIcon.src} />}
        {promptProjectName && <span className='font-normal'>{promptProjectName}</span>}
        {promptProjectName && ' / '}
        {activePrompt?.name ?? projectName ?? 'Prompts'}
      </div>
      {activeProjectID !== undefined && (
        <TopBarButton title='New Prompt' icon={addIcon.src} onClick={() => onAddPrompt(activeProjectID)} />
      )}
    </div>
  )
}

function TopBarButton({ title, icon, onClick }: { title: string; icon?: string; onClick: () => void }) {
  return (
    <div
      className='flex items-center gap-1 py-1 pl-2 pr-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100'
      onClick={onClick}>
      {icon && <img className='w-6 h-6' src={icon} />}
      <div>{title}</div>
    </div>
  )
}
