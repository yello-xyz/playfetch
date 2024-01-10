import { StaticImageData } from 'next/image'
import { KeyboardEvent, ReactNode, useCallback, useState } from 'react'
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
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => {
    onUpdateLabel?.(name)
    setLabel(undefined)
  }

  return (
    <CustomHeader>
      <div className='flex items-center gap-0.5'>
        {icon && label === undefined && <Icon className='-mr-1.5' icon={icon} />}
        {label !== undefined ? (
          <EditableHeaderItem
            value={label}
            onChange={setLabel}
            onSubmit={() => submitRename(label)}
            onCancel={() => setLabel(undefined)}
          />
        ) : (
          tabs.map((tab, index) => (
            <TabButton
              key={index}
              tab={tab}
              activeTab={tabs.length > 1 ? activeTab : undefined}
              setActiveTab={tabs.length > 1 ? setActiveTab : onUpdateLabel ? () => setLabel(tabs[0]) : undefined}
              cursor={onUpdateLabel ? 'cursor-text' : undefined}
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
  cursor = 'cursor-pointer',
}: {
  tab: T
  activeTab?: T
  setActiveTab?: (tab: T) => void
  cursor?: string
}) {
  return (
    <HeaderItem
      active={activeTab === undefined || activeTab === tab}
      className={activeTab === tab ? 'border-b border-black -mb-px' : setActiveTab ? cursor : undefined}
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
  onCancel,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const inputRef = useCallback((node: any) => node?.select(), [])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSubmit()
    } else if (event.key === 'Escape') {
      onCancel()
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
