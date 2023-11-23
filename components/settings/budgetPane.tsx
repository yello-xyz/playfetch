import { CostUsage } from '@/types'
import Label from '../label'
import PercentagePieChart from '../endpoints/percentagePieChart'
import { FormatCost } from '@/src/common/formatting'
import { RefObject, useRef, useState } from 'react'
import api from '@/src/client/api'

export default function BudgetPane({
  scopeID,
  costUsage,
  onRefresh,
}: {
  scopeID: number
  costUsage: CostUsage
  onRefresh: () => Promise<any>
}) {
  const [limit, setLimit] = useState<number>()
  const inputRef = useRef<HTMLInputElement>(null)

  const editingLimit = limit !== undefined

  const editLimit = () => {
    setLimit(costUsage.limit ?? 0)
    setTimeout(() => inputRef.current?.focus())
  }

  const updateLimit = () =>
    api
      .updateBudget(scopeID, editingLimit && !isNaN(limit) && limit > 0 ? limit : undefined)
      .then(onRefresh)
      .then(() => setLimit(undefined))

  return (
    <>
      <SectionHeader
        title='Monthly budget'
        isConfiguring={editingLimit}
        confirmTitle='Save Limit'
        onConfigure={editLimit}
        onConfirm={updateLimit}
      />
      <div className='flex bg-white border border-gray-200 rounded-md'>
        <div className='w-40 h-40 -m-2 scale-[.625]'>
          <PercentagePieChart percentage={costUsage.limit ? costUsage.cost / costUsage.limit : 0} />
        </div>
        <div className='flex flex-col flex-1 gap-2 py-5'>
          <CurrentMonthDescription />
          <div className='flex items-center gap-1 text-xl '>
            <span className='font-bold text-gray-700'>{FormatCost(costUsage.cost)}</span>/
            <BudgetInput
              value={editingLimit ? limit : costUsage.limit}
              setValue={editingLimit ? setLimit : undefined}
              inputRef={inputRef}
            />
          </div>
          <span className='text-gray-400'>
            If the budget is exceeded in a given calendar month, subsequent requests will fail.
          </span>
        </div>
      </div>
    </>
  )
}

const BudgetInput = ({
  value,
  setValue,
  inputRef,
}: {
  value: number | null
  setValue?: (value: number) => void
  inputRef: RefObject<HTMLInputElement>
}) => {
  return value !== null && setValue ? (
    <>
      {' $'}
      <input
        className='px-2 py-1 w-[100px] rounded border focus:border-blue-400 border-gray-200 focus:ring-0 focus:outline-none'
        type='text'
        ref={inputRef}
        value={value}
        onChange={event => setValue(Number(event.target.value))}
      />
    </>
  ) : (
    <span className='px-2 py-1 border border-gray-100 rounded-md bg-gray-25'>{value ? FormatCost(value) : '$ ——'}</span>
  )
}

const SectionHeader = ({
  title,
  isConfiguring,
  confirmTitle,
  onConfigure,
  onConfirm,
}: {
  title: string
  isConfiguring: boolean
  confirmTitle: string
  onConfigure: () => void
  onConfirm: () => void
}) => {
  const buttonClass = isConfiguring ? 'bg-blue-300 hover:bg-blue-500 text-white' : 'hover:bg-gray-50'

  return (
    <div className='flex items-center justify-between'>
      <Label>{title}</Label>
      <div
        className={`${buttonClass} px-2 py-0.5 rounded-md cursor-pointer`}
        onClick={isConfiguring ? onConfirm : onConfigure}>
        {isConfiguring ? confirmTitle : 'Configure'}
      </div>
    </div>
  )
}

const CurrentMonthDescription = () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return (
    <span className='font-medium text-gray-400'>
      1-{lastDay} {today.toLocaleDateString('en', { month: 'long' })}
    </span>
  )
}
