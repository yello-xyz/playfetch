import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptInputs, PromptVersion, Run } from '@/types'
import RunCellHeader from './runCellHeader'
import RunCellFooter from './runCellFooter'
import RunCellBody from './runCellBody'
import RunCellContinuation from './runCellContinuation'

export default function RunCell({
  run,
  version,
  activeItem,
  isRunning,
  isSelected,
  onSelect,
  runVersion,
  selectInputValue,
  onRatingUpdate,
}: {
  run: PartialRun | Run
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isRunning?: boolean
  isSelected?: boolean
  onSelect?: () => void
  runVersion?: (
    getVersion: () => Promise<number>,
    inputs: PromptInputs[],
    dynamicInputs: PromptInputs[],
    continuationID?: number
  ) => Promise<any>
  selectInputValue: (inputKey: string) => string | undefined
  onRatingUpdate?: (run: Run) => Promise<void>
}) {
  const continuationID = run.continuationID
  const isContinuation = !!continuationID || (run.continuations ?? []).length > 0

  const runContinuation =
    version && runVersion
      ? async (continuationID: number, message: string, inputKey: string) =>
          runVersion(() => Promise.resolve(version.id), [{ [inputKey]: message }], [{}], continuationID)
      : undefined

  const baseClass = 'flex flex-col gap-2.5 px-3 pt-3 pb-2.5 whitespace-pre-wrap border rounded-lg text-gray-700'
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
        <RunCellBody run={run} version={version} activeItem={activeItem} isContinuation={isContinuation} />
      </div>
      <RunCellFooter
        run={run}
        activeItem={activeItem}
        isContinuation={isContinuation}
        isSelected={selected}
        onRatingUpdate={onRatingUpdate}
      />
      {isContinuation && (
        <RunCellContinuation
          run={run}
          continuations={run.continuations ?? []}
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
          onRatingUpdate={onRatingUpdate}
        />
      )}
    </div>
  )
}
