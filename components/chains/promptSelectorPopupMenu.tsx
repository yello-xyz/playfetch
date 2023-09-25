import { PopupContent, PopupItem, PopupLabelItem } from '../popupMenu'
import { Prompt } from '@/types'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
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
        <PopupLabelItem
          key={index}
          label={prompt.name}
          icon={promptIcon}
          onClick={withDismiss(() => selectPrompt(prompt.id))}
        />
      ))}
      <div className='pt-1 pb-1 min-w-[200px]'>
        <div className='h-px bg-gray-200' />
      </div>
      <PopupLabelItem label='Create new Prompt' icon={addIcon} onClick={withDismiss(addPrompt)} />
    </PopupContent>
  )
}
