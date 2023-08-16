import { useState } from 'react'
import { PendingButton } from './button'
import DropdownMenu from './dropdownMenu'
import useModalDialogPrompt from './modalDialogContext'
import { InputValues, PromptInputs } from '@/types'

type TestMode = 'first' | 'last' | 'random' | 'all'

const selectInputs = (inputs: InputValues, mode: TestMode): [{ [key: string]: string }[], number[]] => {
  const columns = Object.values(inputs)
  const maxRowCount = Math.max(...columns.map(values => values.length))
  const emptyRowIndices = Array.from({ length: maxRowCount }, (_, index) => index).filter(index =>
    columns.every(column => column[index] === undefined || column[index].length === 0)
  )

  const filteredPaddedInputs: InputValues = {}
  for (const [key, values] of Object.entries(inputs)) {
    filteredPaddedInputs[key] = [
      ...values,
      ...Array.from({ length: maxRowCount - values.length }).map(() => ''),
    ].filter((_, index) => !emptyRowIndices.includes(index))
  }
  const rowCount = Math.max(...Object.values(filteredPaddedInputs).map(values => values.length))
  if (rowCount === 0) {
    return [[], []]
  }

  const entries = Object.entries(filteredPaddedInputs)
  const selectRow = (index: number) => Object.fromEntries(entries.map(([key, values]) => [key, values[index]]))
  const selectedIndices = (() => {
    switch (mode) {
      default:
      case 'first':
        return [0]
      case 'last':
        return [rowCount - 1]
      case 'random':
        return [Math.floor(Math.random() * rowCount)]
      case 'all':
        return Array.from({ length: rowCount }, (_, index) => index)
    }
  })()

  const originalIndices = [] as number[]
  for (let i = 0, offset = 0; i < maxRowCount; ++i) {
    if (emptyRowIndices.includes(i)) {
      ++offset
    } else if (selectedIndices.includes(i - offset)) {
      originalIndices.push(i)
    }
  }

  return [selectedIndices.map(selectRow), originalIndices]
}

export default function TestButtons({
  runTitle,
  variables,
  inputValues,
  disabled,
  callback,
  onSelectIndices,
}: {
  runTitle?: string
  variables: string[]
  inputValues: InputValues
  disabled?: boolean
  callback: (inputs: PromptInputs[]) => Promise<void>
  onSelectIndices: (indices: number[]) => void
}) {
  const [testMode, setTestMode] = useState<TestMode>('first')

  const setDialogPrompt = useModalDialogPrompt()

  const [isRunningAllVariants, setRunningAllVariants] = useState(false)

  const allRows = Object.fromEntries(variables.map(variable => [variable, inputValues[variable] ?? []]))
  const updateTestMode = (mode: TestMode) => {
    setTestMode(mode)
    const [_, indices] = selectInputs(allRows, mode)
    onSelectIndices(indices)
  }

  const testPrompt = async () => {
    const [inputs, indices] = selectInputs(allRows, testMode)
    onSelectIndices(indices)
    if (inputs.length > 1) {
      setDialogPrompt({
        title: `Run ${inputs.length} times?`,
        confirmTitle: 'Run',
        callback: async () => {
          setRunningAllVariants(true)
          await callback(inputs)
          setRunningAllVariants(false)
        },
      })
    } else {
      await callback(inputs)
    }
  }

  const [allInputs] = selectInputs(allRows, 'all')
  return (
    <div className='flex items-center self-end gap-4'>
      <DropdownMenu
        disabled={allInputs.length <= 1}
        size='medium'
        value={testMode}
        onChange={value => updateTestMode(value as TestMode)}>
        <option value={'first'}>First</option>
        <option value={'last'}>Last</option>
        <option value={'random'}>Random</option>
        <option value={'all'}>All</option>
      </DropdownMenu>
      <PendingButton disabled={disabled || isRunningAllVariants} onClick={testPrompt}>
        {runTitle ?? 'Run'}
      </PendingButton>
    </div>
  )
}
