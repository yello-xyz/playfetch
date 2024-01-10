import { ReactNode, startTransition, useCallback, useEffect } from 'react'
import { PendingButton } from '../button'
import { InputValues, PromptInputs, TestConfig } from '@/types'
import { SelectInputRows } from '@/src/client/inputRows'
import SavePromptButton from './savePromptButton'

type TestMode = TestConfig['mode']

const selectValidRowIndices = (
  mode: TestMode,
  selectInputs: (mode: TestMode) => ReturnType<typeof SelectInputRows>
) => {
  switch (mode) {
    case 'first':
    case 'last':
      return selectInputs(mode)[1]
    case 'custom':
    case 'all':
      return selectInputs('all')[1]
  }
}

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
    (config: TestConfig | { mode: TestMode; count?: number; start?: number }) =>
      SelectInputRows(inputValues, inputVariables, {
        mode: config.mode,
        rowIndices: 'rowIndices' in config ? config.rowIndices : [],
      }),
    [inputValues, inputVariables]
  )
  const getIndicesForMode = (mode: TestMode, count?: number, start?: number) => selectInputs({ mode, count, start })[1]

  const [, rowIndices] = selectInputs(testConfig)
  const fallbackIndices = getIndicesForMode('first')
  useEffect(() => {
    const validRowIndices = selectValidRowIndices(testConfig.mode, mode =>
      selectInputs({ mode, count: testConfig.rowIndices.length })
    )
    if (
      testConfig.rowIndices.length !== rowIndices.length ||
      testConfig.rowIndices.some(index => !validRowIndices.includes(index))
    ) {
      startTransition(() => setTestConfig({ ...testConfig, rowIndices }))
    } else if (testConfig.mode === 'custom' && testConfig.rowIndices.length === 0) {
      startTransition(() => setTestConfig({ ...testConfig, mode: 'first', rowIndices: fallbackIndices }))
    }
  }, [testConfig, setTestConfig, rowIndices, fallbackIndices, selectInputs])

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
  const roundedClass = onSave ? 'rounded-l-lg' : undefined

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
          roundedClass={roundedClass}
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
  <div className='flex-1 px-3 py-2 overflow-hidden border rounded-lg h-9 border-pink-50 bg-pink-25 text-ellipsis whitespace-nowrap'>
    {children}
  </div>
)
