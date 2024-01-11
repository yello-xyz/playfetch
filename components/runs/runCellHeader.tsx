import { PartialRun, Run } from '@/types'
import Collapsible from '../collapsible'

export default function RunCellHeader({ run }: { run: Run | PartialRun }) {
  return 'inputs' in run && Object.entries(run.inputs).length > 0 ? (
    <div className='border-b border-b-1 border-gray-200 pb-2.5'>
      <Collapsible title='Inputs' titleClassName='-ml-1' className='ml-2'>
        {Object.entries(run.inputs).map(([variable, value]) => (
          <Collapsible title={variable} key={variable}>
            {value}
          </Collapsible>
        ))}
      </Collapsible>
    </div>
  ) : null
}
