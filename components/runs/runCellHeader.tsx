import { PartialRun, Run } from '@/types'
import { ReactNode, useState } from 'react'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'
import Collapsible from '../collapsible'

export default function RunCellHeader({ run }: { run: Run | PartialRun }) {
  return 'inputs' in run && Object.entries(run.inputs).length > 0 ? (
    <div className='border-b border-b-1 border-gray-200 pb-2.5'>
      <Collapsible title='Inputs' titleClassName='-ml-1'>
        {Object.entries(run.inputs).map(([variable, value]) => (
          <ExpandableInputRow key={variable}>
            <span className='text-sm font-medium text-gray-700'>{variable}: </span>
            <span className='text-gray-500'>{value}</span>
          </ExpandableInputRow>
        ))}
      </Collapsible>
    </div>
  ) : null
}

function ExpandableInputRow({ children }: { children: ReactNode }) {
  const [isExpanded, setExpanded] = useState(false)

  return (
    <div className={`ml-2 cursor-pointer ${isExpanded ? '' : 'line-clamp-1'}`} onClick={() => setExpanded(!isExpanded)}>
      {children}
    </div>
  )
}
