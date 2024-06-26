import { ReactNode, startTransition, useCallback, useEffect } from 'react'
import { PendingButton } from '@/src/client/components/button'
import { InputValues, PromptInputs, TestConfig } from '@/types'
import { SelectInputRows } from '@/src/client/tables/inputRows'
import SavePromptButton from './savePromptButton'

export default function RunButtons({
  runTitle,
  variables,
  staticVariables,
  inputValues,
  testConfig,
  setTestConfig,
  onShowTestConfig,
  disabled,
  callback,
  onSave,
}: {
  runTitle?: string
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  onShowTestConfig?: () => void
  disabled?: boolean
  callback: (inputs: PromptInputs[], dynamicInputs: PromptInputs[]) => Promise<void>
  onSave?: () => void
}) {
  const inputVariables =
    testConfig.autoRespond !== undefined && (testConfig.maxResponses ?? 0) > 0 ? variables : staticVariables
  const selectInputs = useCallback(
    (config?: TestConfig) => SelectInputRows(inputValues, inputVariables, config),
    [inputValues, inputVariables]
  )

  const [, rowIndices] = selectInputs(testConfig)
  useEffect(() => {
    const validRowIndices = selectInputs()[1]
    if (
      testConfig.rowIndices.length !== rowIndices.length ||
      testConfig.rowIndices.some(index => !validRowIndices.includes(index))
    ) {
      startTransition(() => setTestConfig({ ...testConfig, rowIndices }))
    }
  }, [testConfig, setTestConfig, rowIndices, selectInputs])

  const testPrompt = () => {
    const [inputs, indices] = selectInputs(testConfig)
    setTestConfig({ ...testConfig, rowIndices: indices })
    const filterInputs = (inputs: PromptInputs[], variables: string[]) =>
      inputs.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => variables.includes(key))))
    const dynamicVariables = variables.filter(variable => !staticVariables.includes(variable))
    return callback(filterInputs(inputs, staticVariables), filterInputs(inputs, dynamicVariables))
  }

  const isMissingTestData = rowIndices.length === 0 && staticVariables.length > 0
  const showMultipleInputsWarning = testConfig && testConfig.rowIndices.length > 1

  return (
    <div className='flex items-center gap-3 grow'>
      {showMultipleInputsWarning ? (
        <WarningBanner>Running this prompt will use {testConfig.rowIndices.length} rows of test data.</WarningBanner>
      ) : (
        <div className='grow' />
      )}
      <div className='flex items-center'>
        <PendingButton
          title={runTitle ?? 'Run'}
          pendingTitle='Running'
          roundedClass={onSave ? 'rounded-l-lg' : undefined}
          disabled={disabled || isMissingTestData}
          onClick={testPrompt}
          onDisabledClick={!disabled && isMissingTestData ? onShowTestConfig : undefined}
        />
        {onSave && <SavePromptButton onSave={onSave} />}
      </div>
    </div>
  )
}

const WarningBanner = ({ children }: { children: ReactNode }) => (
  <div className='flex-1 h-8 px-3 py-2 overflow-hidden border rounded-lg border-pink-50 bg-pink-25 text-ellipsis whitespace-nowrap'>
    {children}
  </div>
)
