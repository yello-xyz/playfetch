import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptInputs, PromptVersion, Run } from '@/types'
import RunCell from './runCell'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import { BuildInputMap, GetMappedRowForRun } from '@/src/client/runs/runMerging'

type InputMap = ReturnType<typeof BuildInputMap>

const getRowLabelForGroup = (group: (PartialRun | Run)[], sortByInputMap: InputMap | undefined) => {
  if (sortByInputMap) {
    const row = GetMappedRowForRun(group[0], sortByInputMap)
    switch (row) {
      case Infinity:
        return undefined
      case -1:
        return 'Missing Test Data'
      default:
        return `Test Data Row #${row + 1}`
    }
  }
  return undefined
}

export function RunGroup({
  group,
  sortByInputMap,
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
  sortByInputMap?: InputMap
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
  const groupLabel = getRowLabelForGroup(group, sortByInputMap) ?? formattedDate

  return (
    <div className='flex flex-col gap-3'>
      <div className='text-xs font-medium text-center text-gray-500'>{groupLabel}</div>
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
