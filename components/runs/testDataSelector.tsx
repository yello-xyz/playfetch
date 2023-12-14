import { useState } from 'react'
import Button from '../button'
import { TestConfig } from '@/types'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import DropdownMenu from '../dropdownMenu'
import Label from '../label'
import RangeInput from '../rangeInput'
import { CustomPopupButton } from '../popupButton'
import chevronIcon from '@/public/chevronWhite.svg'
import Icon from '../icon'

export default function TestDataSelector({
  testConfig,
  setTestConfig,
  getIndicesForMode,
}: {
  testConfig: TestConfig
  setTestConfig: (config: TestConfig) => void
  getIndicesForMode: (mode: TestConfig['mode'], count?: number, start?: number) => number[]
}) {
  const setPopup = useGlobalPopup<TestDataSelectorPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(TestDataSelectorPopup, { testConfig, setTestConfig, getIndicesForMode }, location)

  const layoutClass = 'flex items-center justify-between gap-1 pl-4 pr-0.5 py-1.5'
  const styleClass = 'bg-blue-400 border-r-2 border-blue-600 rounded-l-lg cursor-pointer  hover:bg-blue-300'
  const textClass = 'overflow-hidden text-sm font-medium text-white whitespace-nowrap text-ellipsis'

  return (
    <CustomPopupButton className={`${layoutClass} ${styleClass} ${textClass}`} popUpAbove onSetPopup={onSetPopup}>
      Test Data
      <Icon icon={chevronIcon} />
    </CustomPopupButton>
  )
}

type TestDataSelectorPopupProps = {
  testConfig: TestConfig
  setTestConfig: (config: TestConfig) => void
  getIndicesForMode: (mode: TestConfig['mode'], count?: number, start?: number) => number[]
}

function TestDataSelectorPopup({
  testConfig,
  setTestConfig,
  getIndicesForMode,
  withDismiss,
}: TestDataSelectorPopupProps & WithDismiss) {
  const validRows = getIndicesForMode('all')
  const rowCount = validRows.length

  const [mode, setMode] = useState(testConfig.mode)
  const [count, setCount] = useState(testConfig.rowIndices.length)
  const [start, setStart] = useState(testConfig.rowIndices[0] ?? validRows[0])
  const confirm = withDismiss(() =>
    setTestConfig({ ...testConfig, mode, rowIndices: getIndicesForMode(mode, count, start) })
  )

  const updateCount = (count: number) => {
    setCount(count)
    setStart(Math.min(start, validRows[rowCount - count]))
  }

  const updateStart = (start: number) => {
    setStart(start)
    setCount(Math.min(count, validRows.slice(validRows.findIndex(index => index >= start)).length))
  }

  const gridConfig = 'grid grid-cols-[110px_minmax(0,1fr)]'

  return (
    <PopupContent className='flex flex-col w-80' autoOverflow={false}>
      <Label className='p-3 text-gray-800 border-b border-gray-300'>Select Test Data</Label>
      <div className={`${gridConfig} w-full items-center gap-2 px-3 py-2`}>
        <Label>Type</Label>
        <DropdownMenu size='xs' value={mode} onChange={value => setMode(value as TestConfig['mode'])}>
          {mode === 'custom' && <option value={'custom'}>Manual selection</option>}
          <option value={'first'}>First</option>
          <option value={'last'}>Last</option>
          {(mode === 'range' || rowCount > 2) && <option value={'range'}>Range</option>}
          <option value={'random'}>Random</option>
          <option value={'all'}>All</option>
        </DropdownMenu>
        {mode === 'range' && (
          <>
            <Label>Start Row #</Label>
            <div className='flex items-center gap-2'>
              <RangeInput
                size='xs'
                className='flex-1'
                value={start + 1}
                setValue={value => updateStart(value - 1)}
                min={validRows[0] + 1}
                max={validRows.slice(-1)[0] + 1}
                step={1}
              />
            </div>
          </>
        )}
        {(mode === 'range' || (mode === 'random' && rowCount > 2)) && (
          <>
            <Label>Number of Rows</Label>
            <div className='flex items-center gap-2'>
              <RangeInput
                size='xs'
                className='flex-1'
                value={count}
                setValue={updateCount}
                min={1}
                max={rowCount - 1}
                step={1}
              />
            </div>
          </>
        )}
      </div>
      <div className='flex justify-end p-3 pt-1'>
        <Button type='primary' onClick={confirm}>
          Select
        </Button>
      </div>
    </PopupContent>
  )
}
