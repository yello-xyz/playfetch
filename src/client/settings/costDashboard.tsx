import { DaysAgo, FormatCost, FormatDate } from '@/src/common/formatting'
import { AvailableModelProvider, CostUsage } from '@/types'
import { Bar, BarChart, Tooltip, XAxis } from 'recharts'
import DashboardContainer from '../endpoints/dashboardContainer'
import { LabelForModel } from '@/src/common/providerMetadata'

const colors = ['#9ACEB2', '#FAE3A8', '#8BBBF3', '#F9D093', '#BEA4F6', '#EC9987']

export default function CostDashboard({
  modelCosts,
  availableProviders,
}: {
  modelCosts: CostUsage['modelCosts']
  availableProviders: AvailableModelProvider[]
}) {
  const days = modelCosts.length || 1
  const averageCost = modelCosts.flatMap(Object.values).reduce((sum, next) => sum + next, 0) / days
  const costForModel = (model: string) => modelCosts.map(cost => cost[model] ?? 0).reduce((sum, next) => sum + next, 0)
  const models = [...new Set(modelCosts.flatMap(Object.keys))].sort((a, b) => costForModel(b) - costForModel(a))
  const data = modelCosts.map((cost, index, costs) => ({
    ...cost,
    name: FormatDate(DaysAgo(new Date(), costs.length - 1 - index).getTime(), false, true),
  }))

  return (
    <DashboardContainer
      title='Average Daily Cost'
      value={FormatCost(averageCost)}
      range={days}
      customRange='Current month'>
      <BarChart id='cost' data={data} margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
        <XAxis dataKey='name' hide />
        <Tooltip cursor={false} content={<CustomTooltip availableProviders={availableProviders} />} />
        {models.map((model, index) => (
          <Bar key={index} dataKey={model} stackId={0} fill={colors[index % colors.length]} />
        ))}
      </BarChart>
    </DashboardContainer>
  )
}

const CustomTooltip = ({
  active,
  payload = [],
  availableProviders,
}: {
  active?: boolean
  payload?: any[]
  availableProviders: AvailableModelProvider[]
}) =>
  active && !!payload && payload.some(p => p.value > 0) ? (
    <div className='flex flex-col gap-2 p-2 text-gray-700 bg-white border border-gray-300 rounded shadow'>
      <span className='pb-1 font-medium border-b border-gray-200'>{payload[0].payload.name}</span>
      {payload
        .slice()
        .reverse()
        .map((entry, index) => (
          <div key={index} className='flex items-center gap-2'>
            <div style={{ backgroundColor: entry.fill }} className='w-3 h-3 rounded-sm' />
            <span className='flex-1'>{LabelForModel(entry.name, availableProviders)}</span>
            <span className='font-medium'>{FormatCost(entry.value)}</span>
          </div>
        ))}
    </div>
  ) : null
