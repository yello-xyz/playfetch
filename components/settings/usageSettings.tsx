import { AvailableModelProvider, CostUsage } from '@/types'
import CostDashboard from './costDashboard'
import BudgetPane from './budgetPane'

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
      <BudgetPane costUsage={costUsage} />
    </div>
  )
}
