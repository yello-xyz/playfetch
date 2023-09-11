import { StaticImageData } from 'next/image'
import { ReactNode } from 'react'
import Icon from './icon'

export function SingleTabHeader({
  label,
  icon,
  secondaryLabel,
  children,
}: {
  label: string
  icon?: StaticImageData
  secondaryLabel?: string
  children?: ReactNode
}) {
  return (
    <TabSelector tabs={[label]} icon={icon} secondaryLabel={secondaryLabel}>
      {children}
    </TabSelector>
  )
}

export default function TabSelector<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
  icon,
  secondaryLabel,
  children,
}: {
  tabs: T[]
  activeTab?: T
  setActiveTab?: (tab: T) => void
  icon?: StaticImageData
  secondaryLabel?: string
  children?: ReactNode
}) {
  return (
    <CustomHeader>
      <div className='flex items-center gap-0.5'>
        {icon && <Icon className='-mr-1.5' icon={icon} />}
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
    <div className='flex items-center justify-between gap-2 px-2 bg-white border-b border-gray-200'>{children}</div>
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
  const cursor = setActiveTab ? 'cursor-pointer hover:text-gray-500' : ''
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
  className = '',
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
    <div className={`flex px-2 py-2.5 font-medium select-none leading-6 ${color} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
