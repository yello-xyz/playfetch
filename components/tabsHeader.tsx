import { StaticImageData } from 'next/image'
import { ReactNode, useState } from 'react'
import Icon from './icon'
import { useDroppable } from '@dnd-kit/core'
import { EditableHeaderItem, HeaderItem } from './headerItem'

export function SingleTabHeader({
  label,
  icon,
  secondaryLabel,
  onUpdateLabel,
  draggableTab,
  dropTarget,
  children,
}: {
  label: string
  icon?: StaticImageData
  secondaryLabel?: string
  onUpdateLabel?: (label: string) => void | Promise<void>
  draggableTab?: boolean
  dropTarget?: string
  children?: ReactNode
}) {
  return (
    <TabsHeader
      tabs={[label]}
      icon={icon}
      secondaryLabel={secondaryLabel}
      onUpdateLabel={onUpdateLabel}
      draggableTabs={draggableTab}
      dropTarget={dropTarget}>
      {children}
    </TabsHeader>
  )
}

export default function TabsHeader<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
  icon,
  secondaryLabel,
  onUpdateLabel,
  draggableTabs,
  dropTarget,
  children,
}: {
  tabs: T[]
  activeTab?: T
  setActiveTab?: (tab: T) => void
  icon?: StaticImageData
  secondaryLabel?: string
  onUpdateLabel?: (label: string) => void | Promise<void>
  draggableTabs?: boolean
  dropTarget?: string
  children?: ReactNode
}) {
  const [label, setLabel] = useState<string>()
  const submitRename = async (name: string) => {
    await onUpdateLabel?.(name)
    setLabel(undefined)
  }

  return (
    <CustomHeader dropTarget={dropTarget}>
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
              draggable={draggableTabs}
            />
          ))
        )}
        {secondaryLabel && <span className='text-gray-400'>{secondaryLabel}</span>}
      </div>
      {children}
    </CustomHeader>
  )
}

export function CustomHeader({ children, dropTarget }: { children?: ReactNode; dropTarget?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: dropTarget ?? '', disabled: !dropTarget })
  const color = isOver ? 'bg-gray-50' : 'bg-white'
  const shadow = 'drop-shadow-[0_4px_14px_rgba(0,0,0,0.03)]'

  return (
    <div
      ref={setNodeRef}
      className={`${color} ${shadow} flex items-center justify-between gap-2 pl-2 pr-1 border-b border-gray-200 `}>
      {children}
    </div>
  )
}

function TabButton<T extends string>({
  tab,
  activeTab,
  setActiveTab,
  cursor = 'cursor-pointer',
  draggable = false,
}: {
  tab: T
  activeTab?: T
  setActiveTab?: (tab: T) => void
  cursor?: string
  draggable?: boolean
}) {
  return (
    <HeaderItem
      active={activeTab === undefined || activeTab === tab}
      className={activeTab === tab ? 'border-b border-black -mb-px' : setActiveTab ? cursor : undefined}
      onClick={() => setActiveTab?.(tab)}
      draggableID={draggable ? tab : undefined}>
      {tab}
    </HeaderItem>
  )
}
