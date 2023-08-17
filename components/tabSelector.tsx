import { ReactNode } from 'react'

export default function TabSelector<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
  children,
}: {
  tabs: T[]
  activeTab: T
  setActiveTab: (tab: T) => void
  children?: ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-1'>
      <div className='flex items-center gap-1 font-medium '>
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
  activeTab: T
  setActiveTab: (tab: T) => void
}) {
  return (
    <div
      className={`px-2 cursor-pointer ${activeTab === tab ? 'text-gray-700' : 'text-gray-300'}`}
      onClick={() => setActiveTab(tab)}>
      {tab}
    </div>
  )
}
