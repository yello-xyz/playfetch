import { useRef, useState } from 'react'
import { Prompt } from '@/types'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import branchIcon from '@/public/branch.svg'
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
  hasNext,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertQuery,
  onInsertCodeBlock,
  onInsertBranch,
  prompts,
}: {
  isDisabled: boolean
  isActive: boolean
  setActive: (active: boolean) => void
  canDismiss: boolean
  hasNext: boolean
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertQuery?: () => void
  onInsertCodeBlock: () => void
  onInsertBranch: () => void
  prompts: Prompt[]
}) {
  return (
    <div className='flex flex-col items-center'>
      <SmallDot margin='-mt-[5px] mb-0.5' />
      <DownStroke height='min-h-[12px]' grow />
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
          onInsertBranch={onInsertBranch}
        />
      )}
      {hasNext ? (
        <>
          <DownArrow height='min-h-[18px]' grow />
          <SmallDot margin='-mb-[5px] mt-1' />
        </>
      ) : (
        <DownStroke height='min-h-[18px]' grow />
      )}
    </div>
  )
}

const SmallDot = ({ margin, color = 'bg-white border border-gray-400' }: { margin: string; color?: string }) => (
  <div className={`${margin} ${color} z-10 w-2.5 h-2.5 rounded-full min-h-[10px]`} />
)

const DownStroke = ({
  height = '',
  color = 'border-gray-400',
  grow = false,
}: {
  height?: string
  color?: string
  grow?: boolean
}) => <div className={`${height} w-px border-l ${color} ${grow ? 'flex-1' : ''}`} />

const DownArrow = ({ height, grow }: { height: string; grow: boolean }) => (
  <>
    <DownStroke height={height} grow={grow} />
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
  onInsertBranch,
}: {
  prompts: Prompt[]
  isActive: boolean
  setActive: (active: boolean) => void
  canDismiss: boolean
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertQuery?: () => void
  onInsertCodeBlock: () => void
  onInsertBranch: () => void
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

  const buttonClass = onInsertQuery ? 'w-1/2' : undefined
  const insertCode = toggleActive(onInsertCodeBlock)

  return isActive ? (
    <>
      <DownArrow height='min-h-[38px]' />
      <SmallDot margin='-mb-[5px] mt-1' color='bg-blue-200' />
      <div ref={buttonRef} className='relative border border-blue-100 border-dashed rounded-lg w-96 bg-blue-25'>
        <div className='flex'>
          <AddStepButton label='Add prompt' className={buttonClass} icon={promptIcon} onClick={togglePopup} />
          <DownStroke color='border-blue-100' />
          {onInsertQuery ? (
            <AddStepButton
              label='Add query'
              className={buttonClass}
              icon={queryIcon}
              onClick={toggleActive(onInsertQuery)}
            />
          ) : (
            <AddCodeAndBranchButtons
              buttonClass={buttonClass}
              onInsertCodeBlock={insertCode}
              onInsertBranch={onInsertBranch}
            />
          )}
          {canDismiss && (
            <div
              className='absolute flex items-center justify-center w-5 h-5 bg-blue-200 rounded-full -top-2.5 -right-2.5 hover:bg-blue-400 hover:cursor-pointer'
              onClick={toggleActive()}>
              <Icon icon={closeIcon} />
            </div>
          )}
        </div>
        {onInsertQuery && (
          <div className='flex border-t border-blue-100'>
            <AddCodeAndBranchButtons
              buttonClass={buttonClass}
              onInsertCodeBlock={insertCode}
              onInsertBranch={onInsertBranch}
            />
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

const AddCodeAndBranchButtons = ({
  buttonClass,
  onInsertCodeBlock,
  onInsertBranch,
}: {
  buttonClass?: string
  onInsertCodeBlock: () => void
  onInsertBranch: () => void
}) => (
  <>
    <AddStepButton label='Add code block' className={buttonClass} icon={codeIcon} onClick={onInsertCodeBlock} />
    <DownStroke color='border-blue-100' />
    <AddStepButton label='Add branch' className={buttonClass} icon={branchIcon} onClick={onInsertBranch} />
  </>
)

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
