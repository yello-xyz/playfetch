import { AvailableModelProvider, CostUsage } from '@/types'
import CostDashboard from './costDashboard'

export default function UsageSettings({
  costUsage,
  availableProviders,
}: {
  costUsage: CostUsage
  availableProviders: AvailableModelProvider[]
}) {
  return <CostDashboard modelCosts={costUsage.modelCosts} availableProviders={availableProviders} />
}
