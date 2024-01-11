import { PartialRun, Run } from '@/types'
import Collapsible from '../collapsible'
import { useState } from 'react'

export default function RunCellHeader({ run }: { run: Run | PartialRun }) {
  const [areChildrenExpanded, setChildrenExpanded] = useState(false)
  const onExpandParent = (expanded: boolean, isShiftClick: boolean) => isShiftClick && setChildrenExpanded(expanded)

  return 'inputs' in run && Object.entries(run.inputs).length > 0 ? (
    <div className='border-b border-b-1 border-gray-200 pb-2.5'>
      <Collapsible title='Inputs' titleClassName='-ml-1' className='ml-2' onSetExpanded={onExpandParent}>
        {Object.entries(run.inputs).map(([variable, value]) => (
          <Collapsible title={variable} key={variable} initiallyExpanded={areChildrenExpanded}>
            {value}
          </Collapsible>
        ))}
      </Collapsible>
    </div>
  ) : null
}
