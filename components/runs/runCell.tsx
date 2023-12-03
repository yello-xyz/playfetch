import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion, Run } from '@/types'
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
  isSelected,
  onSelect,
  runContinuation,
  selectInputValue,
}: {
  identifierForRun: (runID: number) => string
  run: PartialRun | Run
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isRunning?: boolean
  isSelected?: boolean
  onSelect?: () => void
  runContinuation?: (continuationID: number, message: string, inputKey: string) => void
  selectInputValue: (inputKey: string) => string | undefined
}) {
  const continuationID = run.continuationID
  const isContinuation = !!continuationID || (run.continuations ?? []).length > 0

  const baseClass = 'flex flex-col gap-2.5 p-4 whitespace-pre-wrap border rounded-lg text-gray-700'
  const anyRunFailed = [run, ...(run.continuations ?? [])].some(run => run.failed)
  const selected = isSelected || !onSelect
  const colorClass = anyRunFailed
    ? 'bg-red-25 border-red-50'
    : selected
      ? 'bg-blue-25 border-blue-100'
      : 'bg-gray-25 border-gray-200 hover:bg-gray-50 cursor-pointer'

  return (
    <div className={`${baseClass} ${colorClass}`} onClick={isSelected ? undefined : onSelect}>
      <div className='flex flex-col gap-2.5'>
        <RunCellHeader run={run} />
        <RunCellBody
          identifierForRun={identifierForRun}
          run={run}
          version={version}
          activeItem={activeItem}
          isContinuation={isContinuation}
        />
      </div>
      <RunCellFooter run={run} activeItem={activeItem} isContinuation={isContinuation} isSelected={selected} />
      {isContinuation && (
        <RunCellContinuation
          run={run}
          continuations={run.continuations ?? []}
          identifierForRun={identifierForRun}
          activeItem={activeItem}
          version={version}
          isRunning={isRunning}
          isSelected={selected}
          runContinuation={
            runContinuation && continuationID
              ? (message, inputKey) => runContinuation(continuationID, message, inputKey)
              : undefined
          }
          selectInputValue={selectInputValue}
        />
      )}
    </div>
  )
}
