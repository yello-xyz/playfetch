import { useRef, useState } from 'react'
import { Prompt } from '@/types'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import queryIcon from '@/public/query.svg'
import closeIcon from '@/public/closeWhite.svg'
import Icon from '../icon'
import addIcon from '@/public/addSmall.svg'
import addActiveIcon from '@/public/addWhiteSmall.svg'
import { StaticImageData } from 'next/image'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import PromptSelectorPopup, { PromptSelectorPopupProps } from './promptSelectorPopupMenu'

export default function ChainNodeBoxConnector({
  isDisabled,
  isActive,
  setActive,
  canDismiss,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertQuery,
  onInsertCodeBlock,
  prompts,
}: {
  isDisabled: boolean
  isActive: boolean
  setActive: (active: boolean) => void
  canDismiss: boolean
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertQuery?: () => void
  onInsertCodeBlock: () => void
  prompts: Prompt[]
}) {
  return (
    <>
      <SmallDot margin='-mt-[5px] mb-0.5' />
      <DownStroke height='min-h-[12px]' />
      {isDisabled ? (
        <DownStroke height='min-h-[20px]' />
      ) : (
        <AddButton
          prompts={prompts}
          isActive={isActive}
          setActive={setActive}
          canDismiss={canDismiss}
          onInsertPrompt={onInsertPrompt}
          onInsertNewPrompt={onInsertNewPrompt}
          onInsertQuery={onInsertQuery}
          onInsertCodeBlock={onInsertCodeBlock}
        />
      )}
      <DownArrow height='min-h-[18px]' />
      <SmallDot margin='-mb-[5px] mt-1' />
    </>
  )
}

const SmallDot = ({ margin, color = 'bg-white border border-gray-400' }: { margin: string; color?: string }) => (
  <div className={`${margin} ${color} z-10 w-2.5 h-2.5 rounded-full min-h-[10px]`} />
)

const DownStroke = ({ height = 'h-full', color = 'border-gray-400' }: { height?: string; color?: string }) => (
  <div className={`${height} w-px border-l ${color}`} />
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
  canDismiss,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertQuery,
  onInsertCodeBlock,
}: {
  prompts: Prompt[]
  isActive: boolean
  setActive: (active: boolean) => void
  canDismiss: boolean
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertQuery?: () => void
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

  const buttonClass = onInsertQuery ? undefined : 'w-1/2'
  const insertCode = toggleActive(onInsertCodeBlock)

  return isActive ? (
    <>
      <DownArrow height='min-h-[38px]' />
      <SmallDot margin='-mb-[5px] mt-1' color='bg-blue-200' />
      <div ref={buttonRef} className='relative flex border border-blue-100 border-dashed rounded-lg w-96 bg-blue-25'>
        <AddStepButton label='Add prompt' className={buttonClass} icon={promptIcon} onClick={togglePopup} />
        {onInsertQuery && (
          <>
            <DownStroke color='border-blue-100' />
            <AddStepButton label='Add query' icon={queryIcon} onClick={toggleActive(onInsertQuery)} />
          </>
        )}
        <DownStroke color='border-blue-100' />
        <AddStepButton label='Add code block' className={buttonClass} icon={codeIcon} onClick={insertCode} />
        {canDismiss && (
          <div
            className='absolute flex items-center justify-center w-5 h-5 bg-blue-200 rounded-full -top-2.5 -right-2.5 hover:bg-blue-400 hover:cursor-pointer'
            onClick={toggleActive()}>
            <Icon icon={closeIcon} />
          </div>
        )}
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

const AddStepButton = ({
  label,
  icon,
  className = '',
  onClick,
}: {
  label: string
  icon: StaticImageData
  className?: string
  onClick: () => void
}) => {
  const baseClass =
    'flex items-center justify-center gap-1 p-2 m-1 rounded cursor-pointer hover:bg-blue-50 whitespace-nowrap'
  return (
    <div className={`${baseClass} ${className}`} onClick={onClick}>
      <Icon icon={icon} />
      {label}
    </div>
  )
}
