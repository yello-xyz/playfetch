import { StaticImageData } from 'next/image'
import { ReactNode, useCallback, useState } from 'react'
import Icon from './icon'

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
  const [isEditingLabel, setEditingLabel] = useState(false)

  return (
    <CustomHeader>
      <div className='flex items-center gap-0.5'>
        {icon && !isEditingLabel && <Icon className='-mr-1.5' icon={icon} />}
        {isEditingLabel && onUpdateLabel ? (
          <EditableHeaderItem value={tabs[0]} onChange={onUpdateLabel} onSubmit={() => setEditingLabel(false)} />
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
  return (
    <HeaderItem
      active={activeTab === undefined || activeTab === tab}
      className={activeTab === tab ? 'border-b border-black -mb-px' : 'cursor-pointer'}
      onClick={() => setActiveTab?.(tab)}>
      {tab}
    </HeaderItem>
  )
}

const headerClassName =
  'select-none px-2 py-2.5 font-medium outline-none whitespace-nowrap leading-6 text-gray-700 bg-transparent'

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
  const activeClass = active ? '' : 'opacity-40 hover:opacity-70'
  return (
    <div className={`flex ${className} ${headerClassName} ${activeClass}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function EditableHeaderItem({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  const inputRef = useCallback((node: any) => node?.select(), [])

  const onKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <input
      ref={inputRef}
      className={headerClassName}
      value={value}
      onChange={event => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onSubmit}
    />
  )
}
