import { AvailableModelProvider, CostUsage } from '@/types'
import CostDashboard from './costDashboard'
import Label from '../label'
import PercentagePieChart from '../endpoints/percentagePieChart'
import { FormatCost } from '@/src/common/formatting'

export default function UsageSettings({
  costUsage,
  availableProviders,
}: {
  costUsage: CostUsage
  availableProviders: AvailableModelProvider[]
}) {
  return (
    <div className='flex flex-col w-full gap-3'>
      <CostDashboard modelCosts={costUsage.modelCosts} availableProviders={availableProviders} />
      <Label>Monthly budget</Label>
      <div className='flex bg-white border border-gray-200 rounded-md'>
        <div className='w-40 h-40 -m-2 scale-[.625]'>
          <PercentagePieChart percentage={costUsage.limit ? costUsage.cost / costUsage.limit : 0} />
        </div>
        <div className='flex flex-col flex-1 gap-2 py-5'>
          <CurrentMonthDescription />
          <div className='flex items-center gap-1 text-xl '>
            <span className='font-bold text-gray-700'>{FormatCost(costUsage.cost)}</span>
            {costUsage.limit && (
              <span>
                / {FormatCost(costUsage.limit)}
              </span>
            )}
          </div>
          <span className='text-gray-400'>
            If the budget is exceeded in a given calendar month, subsequent requests will fail.
          </span>
        </div>
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
