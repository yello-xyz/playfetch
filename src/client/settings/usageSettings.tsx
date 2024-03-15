import { AvailableModelProvider, CostUsage, Scope } from '@/types'
import CostDashboard from './costDashboard'
import BudgetPane from './budgetPane'

export default function UsageSettings({
  scope,
  scopeID,
  costUsage,
  availableProviders,
  onRefresh,
}: {
  scope: Scope
  scopeID: number
  costUsage: CostUsage
  availableProviders: AvailableModelProvider[]
  onRefresh: () => Promise<any>
}) {
  return (
    <div className='flex flex-col w-full gap-3'>
      <CostDashboard modelCosts={costUsage.modelCosts} availableProviders={availableProviders} />
      <BudgetPane scope={scope} scopeID={scopeID} costUsage={costUsage} onRefresh={onRefresh} />
    </div>
  )
}
