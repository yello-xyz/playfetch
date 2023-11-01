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
import { SmallDot } from './chainNodeBox'

export default function ChainNodeBoxConnector({
  isDisabled,
  isActive,
  setActive,
  canDismiss,
  hasPrevious,
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
  hasPrevious: boolean
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
      <DownStroke height='min-h-[12px]' spacer={hasPrevious} />
      {isDisabled ? (
        <DownStroke height='min-h-[22px]' />
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
      {hasNext ? <DownConnector height='min-h-[18px]' grow /> : <DownStroke height='min-h-[18px]' grow />}
    </div>
  )
}

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
      <DownConnector height={onInsertQuery ? 'min-h-[18px]' : 'min-h-[38px]'} />
      <div className='relative flex flex-col items-center mb-2'>
        <SmallDot position='top' color='bg-blue-200' />
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
        <SmallDot position='bottom' color='bg-blue-200' />
      </div>
      <DownStroke height={onInsertQuery ? 'min-h-[12px]' : 'min-h-[32px]'} />
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

export const DownStroke = ({
  height = '',
  color = 'border-gray-400',
  grow = false,
  spacer = false,
}: {
  height?: string
  color?: string
  grow?: boolean
  spacer?: boolean
}) => <div className={`${height} ${spacer ? 'mt-[7px]' : ''} w-px border-l ${color} ${grow ? 'flex-1' : ''}`} />

export const DownConnector = ({ height = '', grow = false }: { height?: string; grow?: boolean }) => (
  <>
    <DownStroke height={height} grow={grow} />
    <div className='p-1 -mt-2.5 mb-[9px] rotate-45 border-b border-r border-gray-400' />
  </>
)
