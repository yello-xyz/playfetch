import { ReactNode } from 'react'

export default function TabSelector({ children }: { children: ReactNode }) {
  return <div className='flex items-center gap-1 font-medium'>{children}</div>
}

export function TabButton<T>({
  title,
  tab,
  activeTab,
  setActiveTab,
}: {
  title: string
  tab: T
  activeTab: T
  setActiveTab: (tab: T) => void
}) {
  return (
    <div
      className={`px-2 cursor-pointer ${activeTab === tab ? 'text-gray-700' : 'text-gray-300'}`}
      onClick={() => setActiveTab(tab)}>
      {title}
    </div>
  )
}
