import { useState } from 'react'
import { PendingButton } from './button'
import DropdownMenu from './dropdownMenu'
import useModalDialogPrompt from './modalDialogContext'
import { InputValues, PromptInputs } from '@/types'

type TestMode = 'first' | 'last' | 'random' | 'all'

const selectInputs = (inputs: InputValues, mode: TestMode): { [key: string]: string }[] => {
  const columns = Object.values(inputs)
  const maxRowCount = Math.max(...columns.map(values => values.length))
  const emptyRowIndices = Array.from({ length: maxRowCount }, (_, i) => i).filter(i =>
    columns.every(column => column[i] === undefined || column[i].length === 0)
  )

  const filteredPaddedInputs: InputValues = {}
  for (const [key, values] of Object.entries(inputs)) {
    filteredPaddedInputs[key] = [
      ...values,
      ...Array.from({ length: maxRowCount - values.length }).map(() => ''),
    ].filter((_, i) => !emptyRowIndices.includes(i))
  }
  const rowCount = Math.max(...Object.values(filteredPaddedInputs).map(values => values.length))

  if (rowCount === 0) {
    return []
  }

  const entries = Object.entries(filteredPaddedInputs)
  const selectRow = (index: number) => Object.fromEntries(entries.map(([key, values]) => [key, values[index]]))

  switch (mode) {
    default:
    case 'first':
      return [selectRow(0)]
    case 'last':
      return [selectRow(rowCount - 1)]
    case 'random':
      return [selectRow(Math.floor(Math.random() * rowCount))]
    case 'all':
      return Array.from({ length: rowCount }, (_, i) => selectRow(i))
  }
}

export default function TestButtons({
  runTitle,
  variables,
  inputValues,
  disabled,
  callback,
}: {
  runTitle?: string
  variables: string[]
  inputValues: InputValues
  disabled?: boolean
  callback: (inputs: PromptInputs[]) => Promise<void>
}) {
  const [testMode, setTestMode] = useState<TestMode>('first')

  const setDialogPrompt = useModalDialogPrompt()

  const [isRunningAllVariants, setRunningAllVariants] = useState(false)

  const allInputs = Object.fromEntries(variables.map(variable => [variable, inputValues[variable] ?? []]))
  const multipleInputs = selectInputs(allInputs, 'all').length > 1

  const testPrompt = async () => {
    const inputs = selectInputs(allInputs, testMode)
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

  return (
    <div className='flex items-center self-end gap-4'>
      <DropdownMenu
        disabled={!multipleInputs}
        size='medium'
        value={testMode}
        onChange={value => setTestMode(value as TestMode)}>
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
