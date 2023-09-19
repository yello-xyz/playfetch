import { useRef, useState } from 'react'
import { Prompt } from '@/types'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from '../icon'
import addIcon from '@/public/addSmall.svg'
import addActiveIcon from '@/public/addWhiteSmall.svg'
import { StaticImageData } from 'next/image'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import PromptSelectorPopup, { PromptSelectorPopupProps } from './promptSelectorPopupMenu'

export function ChainNodeBoxConnector({
  isActive,
  setActive,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertCodeBlock,
  prompts,
}: {
  isActive: boolean
  setActive: (active: boolean) => void
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertCodeBlock: () => void
  prompts: Prompt[]
}) {
  return (
    <>
      <SmallDot margin='-mt-[5px] mb-0.5' />
      <DownStroke height='min-h-[12px]' />
      <AddButton
        prompts={prompts}
        isActive={isActive}
        setActive={setActive}
        onInsertPrompt={onInsertPrompt}
        onInsertNewPrompt={onInsertNewPrompt}
        onInsertCodeBlock={onInsertCodeBlock}
      />
      <DownArrow height='min-h-[18px]' />
      <SmallDot margin='-mb-[5px] mt-1' />
    </>
  )
}

const SmallDot = ({ margin, color = 'bg-white border border-gray-400' }: { margin: string; color?: string }) => (
  <div className={`${margin} ${color} z-10 w-2.5 h-2.5 rounded-full min-h-[10px]`} />
)

const DownStroke = ({ height = 'h-full', color = 'border-gray-400' }: { height?: string; color?: string }) => (
  <div className={`${height} w-px h-4 border-l ${color}`} />
)

const DownArrow = ({ height }: { height: string }) => (
  <>
    <DownStroke height={height} />
    <div className='p-1 mb-px -mt-2.5 rotate-45 border-b border-r border-gray-400' />
  </>
)

const AddButton = ({
  prompts,
  isActive,
  setActive,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertCodeBlock,
}: {
  prompts: Prompt[]
  isActive: boolean
  setActive: (active: boolean) => void
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertCodeBlock: () => void
}) => {
  const [isHovered, setHovered] = useState(false)
  const hoverClass = isHovered ? 'bg-blue-200' : 'border border-gray-400'

  const toggleActive = (callback?: () => void) => () => {
    setActive(!isActive)
    setHovered(false)
    callback?.()
  }

  const buttonRef = useRef<HTMLDivElement>(null)

  const setPopup = useGlobalPopup<PromptSelectorPopupProps>()

  const togglePopup = () => {
    const iconRect = buttonRef.current?.getBoundingClientRect()!
    setPopup(
      PromptSelectorPopup,
      {
        prompts,
        selectPrompt: promptID => toggleActive(() => onInsertPrompt(promptID))(),
        addPrompt: toggleActive(onInsertNewPrompt),
      },
      { top: iconRect.y + 10, left: iconRect.x + 10 }
    )
  }

  return isActive ? (
    <>
      <DownArrow height='min-h-[38px]' />
      <SmallDot margin='-mb-[5px] mt-1' color='bg-blue-200' />
      <div ref={buttonRef} className='flex p-1 border border-blue-100 border-dashed rounded-lg w-96 bg-blue-25'>
        <AddStepButton label='Add prompt' icon={promptIcon} onClick={togglePopup} />
        <DownStroke color='border-blue-100' />
        <AddStepButton label='Add code block' icon={codeIcon} onClick={toggleActive(onInsertCodeBlock)} />
      </div>
      <SmallDot margin='-mt-[5px] mb-0.5' color='bg-blue-200' />
      <DownStroke height='min-h-[32px]' />
    </>
  ) : (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={toggleActive()}>
      <Icon className={`${hoverClass} my-0.5 rounded-full cursor-pointer`} icon={isHovered ? addActiveIcon : addIcon} />
    </div>
  )
}

const AddStepButton = ({ label, icon, onClick }: { label: string; icon: StaticImageData; onClick: () => void }) => {
  return (
    <div
      className='flex items-center justify-center w-1/2 gap-1 p-2 rounded cursor-pointer hover:bg-blue-50'
      onClick={onClick}>
      <Icon icon={icon} />
      {label}
    </div>
  )
}
