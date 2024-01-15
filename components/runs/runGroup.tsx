import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptInputs, PromptVersion, Run } from '@/types'
import RunCell from './runCell'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'

export function RunGroup({
  group,
  version,
  activeItem,
  isRunSelected,
  selectRun,
  runVersion,
  selectInputValue = () => undefined,
  onRatingUpdate,
  isRunning,
}: {
  group: (PartialRun | Run)[]
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isRunSelected: (run: PartialRun | Run) => boolean
  selectRun: (run: PartialRun | Run) => (() => void) | undefined
  runVersion?: (
    getVersion: () => Promise<number>,
    inputs: PromptInputs[],
    dynamicInputs: PromptInputs[],
    continuationID?: number
  ) => Promise<any>
  selectInputValue?: (inputKey: string) => string | undefined
  onRatingUpdate?: (run: Run) => Promise<void>
  isRunning?: boolean
}) {
  const formattedDate = useFormattedDate(group[0].timestamp ?? new Date().getTime())

  const runContinuation =
    version && runVersion
      ? async (continuationID: number, message: string, inputKey: string) =>
          runVersion(() => Promise.resolve(version.id), [{ [inputKey]: message }], [{}], continuationID)
      : undefined

  return (
    <div className='flex flex-col flex-1 gap-3'>
      <div className='font-medium text-center text-gray-500'>{formattedDate}</div>
      {group.map(run => (
        <RunCell
          key={run.id}
          run={run}
          version={version}
          activeItem={activeItem}
          isRunning={isRunning}
          isSelected={isRunSelected(run)}
          onSelect={selectRun(run)}
          runVersion={runVersion}
          selectInputValue={selectInputValue}
          onRatingUpdate={onRatingUpdate}
        />
      ))}
    </div>
  )
}
