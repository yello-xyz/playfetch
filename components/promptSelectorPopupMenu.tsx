import { PopupContent } from './popupMenu'
import { Prompt } from '@/types'
import Icon from './icon'
import promptIcon from '@/public/prompt.svg'

export type PromptSelectorPopupProps = {
  prompts: Prompt[]
  selectPrompt: (id: number) => void
  onDismissGlobalPopup?: () => void
}

export default function PromptSelectorPopup({ prompts, selectPrompt, onDismissGlobalPopup }: PromptSelectorPopupProps) {
  const dismissAndCallback = (callback: () => void) => () => {
    onDismissGlobalPopup?.()
    callback()
  }

  return (
    <PopupContent className='p-3'>
      {prompts.map((prompt, index) => (
        <div
          className='flex items-center gap-1 p-1 rounded cursor-pointer hover:bg-gray-50'
          key={index}
          onClick={dismissAndCallback(() => selectPrompt(prompt.id))}>
            <Icon icon={promptIcon} />
          {prompt.name}
        </div>
      ))}
    </PopupContent>
  )
}
