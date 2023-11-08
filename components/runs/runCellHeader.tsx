import { ActiveChain, ActivePrompt, PromptInputs, Run } from '@/types'
import { ReactNode, useState } from 'react'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { ItemLabels } from '../versions/versionCell'

export default function RunCellHeader({ run, activeItem }: { run: Run; activeItem?: ActivePrompt | ActiveChain }) {
  const hasLabels = run.labels.length > 0
  const hasInputs = Object.keys(run.inputs).length > 0

  return (
    <>
      <BorderedRow className='flex items-start justify-between text-sm' addBorder={hasInputs || hasLabels}>
        {hasLabels && activeItem ? (
          <ItemLabels labels={run.labels} colors={AvailableLabelColorsForItem(activeItem)} />
        ) : (
          <RunInputs inputs={run.inputs} />
        )}
      </BorderedRow>
      {hasLabels && hasInputs && (
        <BorderedRow>
          <RunInputs inputs={run.inputs} />
        </BorderedRow>
      )}
    </>
  )
}

const BorderedRow = ({
  children,
  className = '',
  addBorder = true,
}: {
  children: ReactNode
  className?: string
  addBorder?: boolean
}) => <div className={`${className} ${addBorder ? 'border-b border-b-1 border-gray-200 pb-2.5' : ''}`}>{children}</div>

function RunInputs({ inputs }: { inputs: PromptInputs }) {
  return Object.entries(inputs).length > 0 ? (
    <CollapsibleInputsHeader>
      {Object.entries(inputs).map(([variable, value]) => (
        <RunInput key={variable} variable={variable} value={value} />
      ))}
    </CollapsibleInputsHeader>
  ) : null
}

function RunInput({ variable, value }: { variable: string; value: string }) {
  return (
    <ExpandableInputRow>
      <span className='font-medium text-gray-700'>{variable}: </span>
      <span className='text-gray-500'>{value}</span>
    </ExpandableInputRow>
  )
}

function CollapsibleInputsHeader({ children }: { children: ReactNode }) {
  const [isExpanded, setExpanded] = useState(false)

  return (
    <div>
      <div className='flex items-center cursor-pointer' onClick={() => setExpanded(!isExpanded)}>
        <Icon className={`-ml-1 ${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className='font-medium text-gray-700'>Inputs</span>
      </div>
      {isExpanded && children}
    </div>
  )
}

function ExpandableInputRow({ children }: { children: ReactNode }) {
  const [isExpanded, setExpanded] = useState(false)

  return (
    <div className={`ml-8 cursor-pointer ${isExpanded ? '' : 'line-clamp-1'}`} onClick={() => setExpanded(!isExpanded)}>
      {children}
    </div>
  )
}
