import { ActivePrompt, PartialRun, PromptInputs, Run } from '@/types'
import { ReactNode, useState } from 'react'
import Icon from './icon'
import chevronIcon from '@/public/chevron.svg'
import LabelPopupMenu, { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import { ItemLabels } from './versionCell'

export default function RunCellHeader({
  run,
  prompt,
  containerRect,
}: {
  run: PartialRun
  prompt?: ActivePrompt
  containerRect?: DOMRect
}) {
  const isProperRun = (item: PartialRun): item is Run => 'labels' in item

  return prompt && isProperRun(run) ? (
    <div className='flex items-start justify-between gap-2 text-sm'>
      <div className='flex flex-col flex-1 gap-1'>
        <ItemLabels labels={run.labels} colors={AvailableLabelColorsForPrompt(prompt)} />
        <RunInputs inputs={run.inputs} />
      </div>
      <LabelPopupMenu containerRect={containerRect} prompt={prompt} item={run} />
    </div>
  ) : null
}

function RunInputs({ inputs }: { inputs: PromptInputs }) {
  return Object.entries(inputs).length > 0 ? (
    <CollapsibleRunHeaderRow title='Inputs' margin='-ml-1' bold>
      {Object.entries(inputs).map(([variable, value]) => (
        <RunInput key={variable} variable={variable} value={value} />
      ))}
    </CollapsibleRunHeaderRow>
  ) : null
}

function RunInput({ variable, value }: { variable: string; value: string }) {
  return (
    <div className='flex-col'>
      <CollapsibleRunHeaderRow title={variable} margin='ml-2' expanded>
        <div className='ml-8 text-gray-500'>{value}</div>
      </CollapsibleRunHeaderRow>
    </div>
  )
}

function CollapsibleRunHeaderRow({
  title,
  margin,
  bold,
  expanded,
  children,
}: {
  title: string
  margin: string
  bold?: boolean
  expanded?: boolean
  children: ReactNode
}) {
  const [isExpanded, setExpanded] = useState(expanded)

  return (
    <>
      <div className='flex items-center cursor-pointer' onClick={() => setExpanded(!isExpanded)}>
        <Icon className={`${margin} ${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className={`${bold ? 'font-medium' : ''} text-gray-700`}>{title}</span>
      </div>
      {isExpanded && children}
    </>
  )
}
