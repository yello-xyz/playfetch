import { AvailableModelProvider, CostUsage } from '@/types'
import CostDashboard from './costDashboard'
import BudgetPane from './budgetPane'

export default function UsageSettings({
  scopeID,
  costUsage,
  availableProviders,
}: {
  scopeID: number
  costUsage: CostUsage
  availableProviders: AvailableModelProvider[]
}) {
  return (
    <div className='flex flex-col w-full gap-3'>
      <CostDashboard modelCosts={costUsage.modelCosts} availableProviders={availableProviders} />
      <BudgetPane scopeID={scopeID} costUsage={costUsage} />
    </div>
  )
}
