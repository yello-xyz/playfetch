import { ActiveChain, ActivePrompt, PromptInputs, Run } from '@/types'
import { ReactNode, useState } from 'react'
import Icon from './icon'
import chevronIcon from '@/public/chevron.svg'
import LabelPopupMenu, { AvailableLabelColorsForItem } from './labelPopupMenu'
import { ItemLabels } from './versionCell'

export default function RunCellHeader({ run, activeItem }: { run: Run; activeItem: ActivePrompt | ActiveChain }) {
  return (
    <div className='flex items-start justify-between gap-2 text-sm'>
      <div className='flex flex-col flex-1 gap-1'>
        <ItemLabels labels={run.labels} colors={AvailableLabelColorsForItem(activeItem)} />
        <RunInputs inputs={run.inputs} />
      </div>
      <LabelPopupMenu activeItem={activeItem} item={run} selectedCell />
    </div>
  )
}

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
    <>
      <div className='flex items-center cursor-pointer' onClick={() => setExpanded(!isExpanded)}>
        <Icon className={`-ml-1 ${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className='font-medium text-gray-700'>Inputs</span>
      </div>
      {isExpanded && children}
    </>
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
