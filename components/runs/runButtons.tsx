import { useCallback, useEffect } from 'react'
import { PendingButton } from '../button'
import { InputValues, PromptInputs, TestConfig } from '@/types'
import TestDataSelector from './testDataSelector'
import { SelectInputRows } from '@/src/client/inputRows'

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
    case 'range':
    case 'random':
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
}) {
  const selectInputs = useCallback(
    (config: TestConfig | { mode: TestMode; count?: number; start?: number }) =>
      SelectInputRows(
        inputValues,
        'rowIndices' in config && config.autoRespond !== undefined && (config.maxResponses ?? 0) > 0
          ? variables
          : staticVariables,
        {
          mode: config.mode,
          rowIndices: 'rowIndices' in config ? config.rowIndices : [],
        },
        'rowIndices' in config ? config.rowIndices.length : config.count,
        'rowIndices' in config ? config.rowIndices[0] : config.start
      ),
    [inputValues, variables, staticVariables]
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
      setTestConfig({ ...testConfig, rowIndices })
    } else if (testConfig.mode === 'custom' && testConfig.rowIndices.length === 0) {
      setTestConfig({ ...testConfig, mode: 'first', rowIndices: fallbackIndices })
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

  const showTestDataSelector = getIndicesForMode('all').length > 1
  const isMissingTestData = rowIndices.length === 0 && staticVariables.length > 0

  return (
    <div className='flex items-center self-end gap-3'>
      <div className='flex items-center'>
        {showTestDataSelector && (
          <TestDataSelector
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            getIndicesForMode={getIndicesForMode}
          />
        )}
        <PendingButton
          title={runTitle ?? 'Run'}
          pendingTitle='Running'
          roundedClass={showTestDataSelector ? 'rounded-r-lg' : undefined}
          disabled={disabled || isMissingTestData}
          onClick={testPrompt}
          onDisabledClick={!disabled && isMissingTestData ? onShowTestConfig : undefined}
        />
      </div>
    </div>
  )
}
