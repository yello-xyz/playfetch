import { ActiveChain, ActivePrompt, ChainVersion, InputValues, PartialRun, PromptVersion, Run } from '@/types'
import RunCellHeader from './runCellHeader'
import RunCellFooter from './runCellFooter'
import RunCellBody from './runCellBody'
import RunCellContinuation from './runCellContinuation'

export default function RunCell({
  identifierForRun,
  run,
  version,
  activeItem,
  isRunning,
  runContinuation,
  selectInputValue,
}: {
  identifierForRun: (runID: number) => string
  run: PartialRun | Run
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isRunning?: boolean
  runContinuation?: (continuationID: number, message: string, inputKey: string) => void
  selectInputValue: (inputKey: string) => string | undefined
}) {
  const isProperRun = ((item): item is Run => 'labels' in item)(run)
  const continuationID = run.continuationID
  const isContinuation = !!continuationID

  const baseClass = 'flex flex-col gap-2.5 p-4 whitespace-pre-wrap border rounded-lg text-gray-700'
  const colorClass = run.failed ? 'bg-red-25 border-red-50' : 'bg-blue-25 border-blue-100'
  const showInlineHeader = isProperRun && !Object.keys(run.inputs).length && !run.labels.length

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <div className={showInlineHeader ? 'flex flex-row-reverse justify-between gap-4' : 'flex flex-col gap-2.5'}>
        {isProperRun && <RunCellHeader run={run} activeItem={activeItem} />}
        <div className='flex flex-col gap-2.5 flex-1'>
          <RunCellBody
            identifierForRun={identifierForRun}
            run={run}
            version={version}
            activeItem={activeItem}
            isContinuation={isContinuation}
          />
        </div>
      </div>
      <RunCellFooter run={run} isContinuation={isContinuation} />
      {isContinuation && (
        <RunCellContinuation
          run={run}
          continuations={run.continuations ?? []}
          identifierForRun={identifierForRun}
          activeItem={activeItem}
          version={version}
          isRunning={isRunning}
          runContinuation={
            runContinuation ? (message, inputKey) => runContinuation(continuationID, message, inputKey) : undefined
          }
          selectInputValue={selectInputValue}
        />
      )}
    </div>
  )
}
