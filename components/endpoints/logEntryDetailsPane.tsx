import { Chain, ChainVersion, ProjectItemIsChain, LogEntry, Prompt, PromptVersion } from '@/types'
import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import collapseIcon from '@/public/collapse.svg'
import IconButton from '../iconButton'
import Icon from '../icon'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Label from '../label'
import { CodeBlock } from './examplePane'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { SingleTabHeader } from '../tabSelector'

export default function LogEntryDetailsPane({
  logEntry,
  parent,
  versions,
  onCollapse,
}: {
  logEntry: LogEntry
  parent?: Prompt | Chain
  versions: PromptVersion[] | ChainVersion[]
  onCollapse: () => void
}) {
  const formattedDate = useFormattedDate(logEntry.timestamp, timestamp => FormatDate(timestamp, true, true))

  const versionIndex = versions.findIndex(version => version.id === logEntry.versionID)

  const gridConfig = 'grid grid-cols-[160px_minmax(0,1fr)]'
  return (
    <div className='flex flex-col w-full h-full bg-gray-25'>
      <SingleTabHeader label={logEntry.urlPath} secondaryLabel={formattedDate}>
        {onCollapse && <IconButton icon={collapseIcon} onClick={onCollapse} />}
      </SingleTabHeader>
      <div className='flex flex-col gap-6 p-4 overflow-y-auto'>
        <div className={`${gridConfig} w-full items-center gap-4 p-6 py-4 bg-white border border-gray-200 rounded-lg`}>
          {parent && (
            <>
              {ProjectItemIsChain(parent) ? 'Chain' : 'Prompt'}
              <div className='flex items-center justify-end gap-1'>
                <Icon icon={ProjectItemIsChain(parent) ? chainIcon : promptIcon} />
                {`${parent.name}${versionIndex >= 0 ? ` - Version ${versionIndex + 1}` : ''}`}
              </div>
            </>
          )}
          <span>Environment</span>
          <span className='flex justify-end'>{logEntry.flavor}</span>
          <span>Status</span>
          <span className={`flex justify-end ${logEntry.error ? 'text-red-300' : 'text-green-300'}`}>
            {logEntry.error ? 'Error' : 'Success'}
          </span>
          <span>Cost</span>
          <span className='flex justify-end'>{FormatCost(logEntry.cost)}</span>
          <span>Duration</span>
          <span className='flex justify-end'>{FormatDuration(logEntry.duration)}</span>
          <span>Cache Hit</span>
          <span className='flex justify-end'>{logEntry.cacheHit ? 'Yes' : 'No'}</span>
          <span>Attempts</span>
          <span className='flex justify-end'>{logEntry.attempts}</span>
        </div>
        {Object.keys(logEntry.inputs).length > 0 && (
          <>
            <Label className='-mb-4'>Input</Label>
            <CodeBlock>{JSON.stringify(logEntry.inputs, null, 2)}</CodeBlock>
          </>
        )}
        {logEntry.error ? (
          <>
            <Label className='-mb-4'>Error</Label>
            <CodeBlock error>{logEntry.error}</CodeBlock>
          </>
        ) : (
          <>
            <Label className='-mb-4'>Output</Label>
            <CodeBlock>{JSON.stringify(logEntry.output, null, 2)}</CodeBlock>
          </>
        )}
      </div>
    </div>
  )
}
