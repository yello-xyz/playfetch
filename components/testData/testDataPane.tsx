import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { InputValues, TestConfig } from '@/types'
import { SelectInputRows } from '@/src/client/inputRows'
import DropdownMenu from '../dropdownMenu'
import Label from '../label'
import RangeInput from '../rangeInput'
import Checkbox from '../checkbox'
import TableEditor, { GetTableRowCount, GetTableValueForRow, HasTableData } from './tableEditor'
import Button from '../button'

export default function TestDataPane({
  variables,
  staticVariables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  testConfig,
  setTestConfig,
  asModalPopup = false,
  skipButtonBorder = false,
}: {
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  setInputValues: Dispatch<SetStateAction<InputValues>>
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  asModalPopup?: boolean
  skipButtonBorder?: boolean
}) {
  const rowCount = GetTableRowCount(variables, inputValues)

  const isRelevantRowEmpty = (row: number) =>
    (testConfig.autoRespond !== undefined ? variables : staticVariables).every(
      variable => GetTableValueForRow(row, variable, inputValues).length === 0
    )
  const isRowSelected = (row: number) => testConfig.rowIndices.includes(row)

  const toggleRow = (row: number) => {
    const rowIndices = testConfig.rowIndices.includes(row)
      ? testConfig.rowIndices.filter(index => index !== row)
      : [...testConfig.rowIndices, row]
    setTestConfig({ ...testConfig, rowIndices })
  }

  const selectedRowCount = testConfig.rowIndices.length
  const toggleAll = () => {
    const nonEmptyRowIndices = Array.from({ length: rowCount }, (_, index) => index).filter(
      row => !isRelevantRowEmpty(row)
    )
    if (selectedRowCount < nonEmptyRowIndices.length) {
      setTestConfig({ ...testConfig, rowIndices: nonEmptyRowIndices })
    } else if (nonEmptyRowIndices.length > 1) {
      setTestConfig({ ...testConfig, rowIndices: nonEmptyRowIndices.slice(0, 1) })
    }
  }

  const dynamicVariables = variables.filter(variable => !staticVariables.includes(variable))
  const [_, dynamicInputRows] = SelectInputRows(inputValues, dynamicVariables, testConfig)
  const shouldShowOptions = !asModalPopup && dynamicInputRows.length > 0

  const hasTestData = HasTableData(variables, inputValues)
  const [startFromScratch, setStartFromScratch] = useState(false)

  useEffect(() => setStartFromScratch(startFromScratch && !hasTestData), [startFromScratch, hasTestData])

  return HasTableData(variables, inputValues) || startFromScratch ? (
    <div className='flex flex-col items-stretch flex-1 h-full overflow-y-auto'>
      <TableEditor
        inputValues={inputValues}
        setInputValues={setInputValues}
        persistInputValuesIfNeeded={persistInputValuesIfNeeded}
        variables={variables}
        staticVariables={staticVariables}
        gutterColumn={row => (
          <Checkbox
            checked={isRowSelected(row)}
            disabled={isRowSelected(row) ? selectedRowCount === 1 : isRelevantRowEmpty(row) || selectedRowCount === 0}
            setChecked={() => toggleRow(row)}
          />
        )}
        onToggleAll={toggleAll}
        skipExpandButtons={asModalPopup}
        inModal={asModalPopup}
      />
      {(!skipButtonBorder || shouldShowOptions) && <div className='border-b border-gray-200' />}
      {shouldShowOptions && (
        <div className='flex flex-wrap items-center px-3 py-2 gap-y-2 gap-x-4'>
          <OptionSection
            label={
              <>
                Use values for <span className='font-medium text-purple-400'>dynamic inputs</span> as
              </>
            }>
            <DropdownMenu
              size='xs'
              value={autoRespondModeFromTestConfig(testConfig)}
              onChange={value => setTestConfig(testConfigWithAutoRespondMode(testConfig, value as DynamicMode))}>
              <option value='manual'>suggested manual responses</option>
              <option value='static'>fixed mocked responses</option>
              <option value='dynamic'>personas for automated responses</option>
            </DropdownMenu>
          </OptionSection>
          {testConfig.autoRespond !== undefined && (
            <OptionSection label='Maximum number of responses'>
              <div className='flex items-center flex-1 gap-2'>
                <RangeInput
                  size='xs'
                  className='flex-1'
                  value={testConfig.maxResponses ?? DefaultMaxResponses}
                  setValue={value =>
                    setTestConfig({ ...testConfig, maxResponses: isNaN(Number(value)) ? 0 : Number(value) })
                  }
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </OptionSection>
          )}
        </div>
      )}
    </div>
  ) : (
    <EmptyTestData bottomPadding={asModalPopup ? 'pb-4' : ''} onStartFromScratch={() => setStartFromScratch(true)} />
  )
}

const OptionSection = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <div className='flex items-center gap-2 w-[450px]'>
    <Label className='w-[200px]'>{label}</Label>
    {children}
  </div>
)

type DynamicMode = 'manual' | 'static' | 'dynamic'
const DefaultMaxResponses = 1

const autoRespondModeFromTestConfig = (testConfig: TestConfig): DynamicMode => {
  if (testConfig.autoRespond === true) {
    return 'dynamic'
  } else if (testConfig.autoRespond === false) {
    return 'static'
  } else {
    return 'manual'
  }
}

const testConfigWithAutoRespondMode = (testConfig: TestConfig, mode: DynamicMode): TestConfig => ({
  ...testConfig,
  autoRespond: mode === 'dynamic' ? true : mode === 'static' ? false : undefined,
  maxResponses: mode === 'manual' ? undefined : testConfig.maxResponses ?? DefaultMaxResponses,
})

const EmptyTestData = ({
  bottomPadding,
  onStartFromScratch,
}: {
  bottomPadding: string
  onStartFromScratch: () => void
}) => (
  <div className={`${bottomPadding} w-full px-4 pt-4 text-gray-700`}>
    <div className='flex flex-col items-center justify-center gap-1 p-6 border border-gray-200 rounded-lg bg-gray-25'>
      <span className='font-medium'>Create Test Data</span>
      <span className='text-sm text-center text-gray-400'>
        Test data allows you to test different inputs to your prompt.
      </span>
      <span className='mt-2'>
        <Button type='secondary' onClick={onStartFromScratch}>
          Start from scratch
        </Button>
      </span>
    </div>
  </div>
)
