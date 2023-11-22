import { AvailableModelProvider, CostUsage } from '@/types'
import CostDashboard from './costDashboard'
import BudgetPane from './budgetPane'

export default function UsageSettings({
  scopeID,
  costUsage,
  availableProviders,
  onRefresh,
}: {
  scopeID: number
  costUsage: CostUsage
  availableProviders: AvailableModelProvider[]
  onRefresh: () => Promise<any>
}) {
  return (
    <div className='flex flex-col w-full gap-3'>
      <CostDashboard modelCosts={costUsage.modelCosts} availableProviders={availableProviders} />
      <BudgetPane scopeID={scopeID} costUsage={costUsage} onRefresh={onRefresh} />
    </div>
  )
}
