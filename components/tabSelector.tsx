import { ReactNode } from 'react'

export function SingleTabHeader({
  label,
  secondaryLabel,
  children,
}: {
  label: string
  secondaryLabel?: string
  children?: ReactNode
}) {
  return (
    <TabSelector tabs={[label]} secondaryLabel={secondaryLabel}>
      {children}
    </TabSelector>
  )
}

export default function TabSelector<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
  secondaryLabel,
  children,
}: {
  tabs: T[]
  activeTab?: T
  setActiveTab?: (tab: T) => void
  secondaryLabel?: string
  children?: ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-1 px-4 bg-white border-b border-gray-200'>
      <div className='flex items-center gap-1 font-medium leading-6'>
        {tabs.map((tab, index) => (
          <TabButton
            key={index}
            tab={tab}
            activeTab={tabs.length > 1 ? activeTab : undefined}
            setActiveTab={tabs.length > 1 ? setActiveTab : undefined}
          />
        ))}
        {secondaryLabel && <span className='text-gray-400'>{secondaryLabel}</span>}
      </div>
      {children}
    </div>
  )
}

function TabButton<T extends string>({
  tab,
  activeTab,
  setActiveTab,
}: {
  tab: T
  activeTab?: T
  setActiveTab?: (tab: T) => void
}) {
  const color = activeTab === undefined || activeTab === tab ? 'text-gray-700' : 'text-gray-300'
  const underline = activeTab === tab ? 'border-b border-black -mb-px' : ''
  const cursor = setActiveTab ? 'cursor-pointer' : ''
  return (
    <div className={`px-2 py-2.5 ${color} ${underline} ${cursor}`} onClick={() => setActiveTab?.(tab)}>
      {tab}
    </div>
  )
}
