import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useState } from 'react'
import { InputValues, TestConfig } from '@/types'
import { SelectInputRows } from '@/src/client/inputRows'
import DropdownMenu from '../dropdownMenu'
import Label from '../label'
import RangeInput from '../rangeInput'
import Checkbox from '../checkbox'
import TableEditor, { GetTableRowCount, GetTableValueForRow, HasTableData } from './tableEditor'
import Button from '../button'
import { useDropzone } from 'react-dropzone'
import { parse } from 'csv-parse/sync'

export default function TestDataPane({
  variables,
  staticVariables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  addInputValues,
  testConfig,
  setTestConfig,
  importButton,
  asModalPopup = false,
  skipButtonBorder = false,
}: {
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  setInputValues: Dispatch<SetStateAction<InputValues>>
  persistInputValuesIfNeeded: () => void
  addInputValues: (variable: string, inputs: string[]) => Promise<void>
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  importButton?: () => ReactNode
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
    <EmptyTestData
      bottomPadding={asModalPopup ? 'pb-4' : ''}
      onStartFromScratch={() => setStartFromScratch(true)}
      onAddInputValues={addInputValues}
      importButton={importButton}
    />
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
  onAddInputValues,
  importButton,
}: {
  bottomPadding: string
  onStartFromScratch: () => void
  onAddInputValues: (variable: string, inputs: string[]) => Promise<void>
  importButton?: () => ReactNode
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [progress, setProgress] = useState<number>()

  const onDrop = useCallback(([file]: File[]) => {
    if (file) {
      setShowFileUpload(false)
      setProgress(0)
      const reader = new FileReader()
      reader.onload = async () => {
        if (reader.result && typeof reader.result !== 'string') {
          const rows: string[][] = parse(Buffer.from(reader.result))
          const cols = rows[0].map((_, colIndex) => rows.map(row => row[colIndex]))
          for (const [index, col] of cols.entries()) {
            setProgress((index + 1) / cols.length)
            await onAddInputValues(col[0], col.slice(1))
          }
          setProgress(undefined)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const {
    getRootProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({ onDrop, noClick: true, accept: { 'text/csv': ['.csv'] }, maxFiles: 1 })

  const baseClass = 'flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg'
  const backgroundColor = isDragActive ? 'bg-gray-100' : 'bg-gray-25'
  const layoutClass = showFileUpload || progress !== undefined ? 'min-h-[136px] gap-3' : 'gap-1'
  const borderClass = showFileUpload ? 'border-dashed' : ''

  return (
    <div className={`${bottomPadding} w-full px-4 pt-4 text-gray-700`} {...(showFileUpload ? getRootProps() : {})}>
      <div className={`${baseClass} ${backgroundColor} ${layoutClass} ${borderClass}`}>
        {showFileUpload ? (
          <>
            <span>Drag and drop to upload your CSV file.</span>
            <div className='flex items-center gap-2'>
              <Button type='secondary' onClick={() => setShowFileUpload(false)}>
                Cancel
              </Button>
              <Button type='secondary' onClick={openFileDialog}>
                Browse for CSV file
              </Button>
            </div>
          </>
        ) : progress !== undefined ? (
          <>
            <span>Uploading...</span>
            <ProgressBar progress={progress} maxWidth='max-w-[380px]' />
          </>
        ) : (
          <>
            <span className='font-medium'>Create Test Data</span>
            <span className='text-sm text-center text-gray-400'>
              Test data allows you to test different inputs to your prompt.
            </span>
            <span className='flex items-center gap-2 mt-2'>
              {importButton && importButton()}
              <Button type='secondary' onClick={() => setShowFileUpload(true)}>
                Import CSV
              </Button>
              <Button type='secondary' onClick={onStartFromScratch}>
                Start from scratch
              </Button>
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const ProgressBar = ({ progress, maxWidth = '' }: { progress: number; maxWidth?: string }) => (
  <div className={`${maxWidth} w-full rounded h-1.5 bg-gray-200`}>
    <div
      className={`h-full bg-blue-400 rounded-l ${progress < 1 ? '' : 'rounded-r'}`}
      style={{ width: `${progress * 100}%` }}
    />
  </div>
)
