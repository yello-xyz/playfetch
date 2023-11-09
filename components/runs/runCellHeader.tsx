import { PartialRun, PromptInputs, Run } from '@/types'
import { ReactNode, useState } from 'react'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'

export default function RunCellHeader({ run }: { run: Run | PartialRun }) {
  return 'inputs' in run && Object.keys(run.inputs).length > 0 ? (
    <BorderedRow>
      <RunInputs inputs={run.inputs} />
    </BorderedRow>
  ) : null
}

const BorderedRow = ({ children, addBorder = true }: { children: ReactNode; addBorder?: boolean }) => (
  <div className={`${addBorder ? 'border-b border-b-1 border-gray-200 pb-2.5' : ''}`}>{children}</div>
)

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
      <span className='text-sm font-medium text-gray-700'>{variable}: </span>
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
