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
    <CustomHeader>
      <div className='flex items-center gap-1'>
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
    </CustomHeader>
  )
}

export function CustomHeader({ children }: { children?: ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-1 px-2 bg-white border-b border-gray-200'>{children}</div>
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
  const underline = activeTab === tab ? 'border-b border-black -mb-px' : ''
  const cursor = setActiveTab ? 'cursor-pointer' : ''
  return (
    <HeaderItem
      active={activeTab === undefined || activeTab === tab}
      className={`${underline} ${cursor}`}
      onClick={() => setActiveTab?.(tab)}>
      {tab}
    </HeaderItem>
  )
}

export function HeaderItem({
  active = true,
  className,
  onClick,
  children,
}: {
  active?: boolean
  className?: string
  onClick?: () => void
  children?: ReactNode
}) {
  const color = active ? 'text-gray-700' : 'text-gray-300'
  return (
    <div className={`px-2 py-2.5 font-medium select-none leading-6 ${color} ${className ?? ''}`} onClick={onClick}>
      {children}
    </div>
  )
}
