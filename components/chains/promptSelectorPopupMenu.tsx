import { PopupContent } from '../popupMenu'
import { Prompt } from '@/types'
import Icon from '../icon'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import { StaticImageData } from 'next/image'
import { WithDismiss } from '@/src/client/context/globalPopupContext'

export type PromptSelectorPopupProps = {
  prompts: Prompt[]
  selectPrompt: (id: number) => void
  addPrompt: () => void
}

export default function PromptSelectorPopup({
  prompts,
  selectPrompt,
  addPrompt,
  withDismiss,
}: PromptSelectorPopupProps & WithDismiss) {
  return (
    <PopupContent className='p-3'>
      {prompts.map((prompt, index) => (
        <PopupItem
          key={index}
          label={prompt.name}
          icon={promptIcon}
          onClick={withDismiss(() => selectPrompt(prompt.id))}
        />
      ))}
      <div className='pt-1 pb-1 min-w-[200px]'>
        <div className='h-px bg-gray-200' />
      </div>
      <PopupItem label='Create new Prompt' icon={addIcon} onClick={withDismiss(addPrompt)} />
    </PopupContent>
  )
}

function PopupItem({ label, icon, onClick }: { label: string; icon: StaticImageData; onClick: () => void }) {
  return (
    <div className='flex items-center gap-1 p-1 rounded cursor-pointer hover:bg-gray-50' onClick={onClick}>
      <Icon icon={icon} />
      {label}
    </div>
  )
}
