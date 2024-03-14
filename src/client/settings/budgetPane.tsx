import { CostUsage, Scope } from '@/types'
import Label from '@/src/client/components/label'
import PercentagePieChart from '@/src/client/endpoints/percentagePieChart'
import { Capitalize, FormatCost } from '@/src/common/formatting'
import { ReactNode, RefObject, useRef, useState } from 'react'
import api from '@/src/client/api'

export default function BudgetPane({
  scope,
  scopeID,
  costUsage,
  onRefresh,
}: {
  scope: Scope
  scopeID: number
  costUsage: CostUsage
  onRefresh: () => Promise<any>
}) {
  const recipient = recipientForScope(scope)

  const [limit, setLimit, limitInputRef, editingLimit, editLimit, updateLimit] = useBudgetEditor(
    scope,
    scopeID,
    costUsage,
    'limit',
    onRefresh
  )
  const [threshold, setThreshold, thresholdInputRef, editingThreshold, editThreshold, updateThreshold] =
    useBudgetEditor(scope, scopeID, costUsage, 'threshold', onRefresh)

  return (
    <>
      <SectionHeader
        title='Monthly budget'
        isConfiguring={editingLimit}
        confirmTitle='Save Limit'
        onConfigure={editLimit}
        onConfirm={updateLimit}
      />
      <RoundedSection>
        <div className='w-40 h-40 -m-2 scale-[.625]'>
          <PercentagePieChart percentage={costUsage.limit ? costUsage.cost / costUsage.limit : 0} />
        </div>
        <div className='flex flex-col flex-1 gap-2 py-4'>
          <CurrentMonthDescription />
          <div className='flex items-center gap-1 text-xl '>
            <span className='font-bold text-gray-700'>{FormatCost(costUsage.cost)}</span>/
            <BudgetInput
              value={editingLimit ? limit! : costUsage.limit}
              setValue={editingLimit ? setLimit : undefined}
              inputRef={limitInputRef}
            />
          </div>
          <span className='pr-4 text-gray-400'>
            {`If the budget is exceeded in a given calendar month, ${recipient} will be sent an email notification and
            subsequent requests will fail until the start of the next month.`}
          </span>
        </div>
      </RoundedSection>
      <SectionHeader
        title='Email threshold'
        isConfiguring={editingThreshold}
        confirmTitle='Save Threshold'
        onConfigure={editThreshold}
        onConfirm={updateThreshold}
      />
      <RoundedSection>
        <div className='flex items-center gap-8 p-5 text-xl'>
          <BudgetInput
            value={editingThreshold ? threshold! : costUsage.threshold}
            setValue={editingThreshold ? setThreshold : undefined}
            inputRef={thresholdInputRef}
          />
          <span className='text-sm text-gray-400'>
            {`${Capitalize(
              recipient
            )} will receive an email notification when the threshold is reached within a given calendar month.`}
          </span>
        </div>
      </RoundedSection>
    </>
  )
}

const recipientForScope = (scope: 'workspace' | 'project' | 'user') => {
  switch (scope) {
    case 'workspace':
      return 'workspace owners'
    case 'project':
      return 'project owners'
    case 'user':
      return 'you'
  }
}

const useBudgetEditor = (
  scope: string,
  scopeID: number,
  costUsage: CostUsage,
  fieldToEdit: 'limit' | 'threshold',
  onRefresh: () => Promise<any>
) => {
  const [value, setValue] = useState<number>()
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = value !== undefined

  const isThreshold = fieldToEdit === 'threshold'
  const edit = () => {
    setValue((isThreshold ? costUsage.threshold : costUsage.limit) ?? 0)
    setTimeout(() => inputRef.current?.focus())
  }

  const updateValue = isEditing && !isNaN(value) && value > 0 ? value : undefined
  const update = () =>
    api
      .updateBudget(
        scope,
        scopeID,
        isThreshold ? costUsage.limit ?? undefined : updateValue,
        isThreshold ? updateValue : costUsage.threshold ?? undefined
      )
      .then(onRefresh)
      .then(() => setValue(undefined))

  return [value, setValue, inputRef, isEditing, edit, update] as const
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
        onChange={event => {
          const numberValue = Number(event.target.value)
          setValue(isNaN(numberValue) ? 0 : numberValue)
        }}
      />
    </>
  ) : (
    <span className='px-2 py-1 border border-gray-100 rounded-md bg-gray-25 whitespace-nowrap'>
      {value ? FormatCost(value) : '$ ——'}
    </span>
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

const RoundedSection = ({ children }: { children: ReactNode }) => (
  <div className='flex bg-white border border-gray-200 rounded-md'>{children}</div>
)

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
