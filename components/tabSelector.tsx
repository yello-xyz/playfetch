import { StaticImageData } from 'next/image'
import { ReactNode, useCallback, useState } from 'react'
import Icon from './icon'
import useInitialState from '@/src/client/hooks/useInitialState'

export function SingleTabHeader({
  label,
  icon,
  secondaryLabel,
  onUpdateLabel,
  children,
}: {
  label: string
  icon?: StaticImageData
  secondaryLabel?: string
  onUpdateLabel?: (label: string) => void
  children?: ReactNode
}) {
  return (
    <TabSelector tabs={[label]} icon={icon} secondaryLabel={secondaryLabel} onUpdateLabel={onUpdateLabel}>
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
  onUpdateLabel,
  children,
}: {
  tabs: T[]
  activeTab?: T
  setActiveTab?: (tab: T) => void
  icon?: StaticImageData
  secondaryLabel?: string
  onUpdateLabel?: (label: string) => void
  children?: ReactNode
}) {
  const [label, setLabel] = useInitialState<string>(tabs[0])
  const [isEditingLabel, setEditingLabel] = useState(false)
  const inputRef = useCallback((node: any) => node?.select(), [])

  const onKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      onUpdateLabel?.(label)
      setEditingLabel(false)
    }
  }

  return (
    <CustomHeader>
      <div className='flex items-center gap-0.5'>
        {icon && <Icon className='-mr-1.5' icon={icon} />}
        {isEditingLabel ? (
          <input
            ref={inputRef}
            className={headerClassName()}
            value={label}
            onChange={event => setLabel(event.target.value)}
            onKeyDown={onKeyDown}
          />
        ) : (
          tabs.map((tab, index) => (
            <TabButton
              key={index}
              tab={tab}
              activeTab={tabs.length > 1 ? activeTab : undefined}
              setActiveTab={tabs.length > 1 ? setActiveTab : onUpdateLabel ? () => setEditingLabel(true) : undefined}
            />
          ))
        )}
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

const headerClassName = (active = true) =>
  `px-2 py-2.5 font-medium outline-none leading-6 ${active ? 'text-gray-700' : 'text-gray-300'}}`

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
  return (
    <div className={`flex select-none ${headerClassName(active)} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
