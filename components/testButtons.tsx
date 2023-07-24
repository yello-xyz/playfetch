import { useState } from 'react'
import { PendingButton } from './button'
import DropdownMenu from './dropdownMenu'
import useModalDialogPrompt from './modalDialogContext'
import { InputValues, PromptInputs } from '@/types'

type TestMode = 'first' | 'last' | 'random' | 'all'

const selectInputs = (inputs: InputValues, mode: TestMode): { [key: string]: string }[] => {
  const selectInput = (inputs: string[], mode: TestMode): string => {
    switch (mode) {
      default:
      case 'first':
        return inputs[0] ?? ''
      case 'last':
        return inputs[inputs.length - 1] ?? ''
      case 'random':
        return inputs[Math.floor(Math.random() * inputs.length)] ?? ''
    }
  }

  const cartesian = (array: string[][]) =>
    array.reduce(
      (a, b) => {
        return a
          .map(x => {
            return b.map(y => {
              return x.concat(y)
            })
          })
          .reduce((c, d) => c.concat(d), [])
      },
      [[]] as string[][]
    )

  const entries = Object.entries(inputs)

  switch (mode) {
    default:
    case 'first':
    case 'last':
    case 'random':
      return [Object.fromEntries(entries.map(([key, values]) => [key, selectInput(values, mode)]))]
    case 'all':
      const keys = entries.map(([key, _]) => key)
      const values = cartesian(entries.map(([_, values]) => values))
      return values.map(value => Object.fromEntries(keys.map((key, i) => [key, value[i]])))
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

  const testPrompt = async () => {
    const allInputs = Object.fromEntries(variables.map(variable => [variable, inputValues[variable] ?? []]))
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
        disabled={!variables.length}
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
