import { ReactNode } from 'react'

export default function TabSelector<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
  children,
}: {
  tabs: T[]
  activeTab?: T
  setActiveTab?: (tab: T) => void
  children?: ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-1 px-4 py-2.5 bg-white border-b border-gray-200'>
      <div className='flex items-center gap-1 font-medium leading-6'>
        {tabs.map((tab, index) => (
          <TabButton key={index} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
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
  const textColor = activeTab === undefined || activeTab === tab ? 'text-gray-700' : 'text-gray-300'
  const cursor = setActiveTab ? 'cursor-pointer' : ''
  return (
    <div className={`px-2 ${textColor} ${cursor}`} onClick={() => setActiveTab?.(tab)}>
      {tab}
    </div>
  )
}
