import { AdminRoute } from '@/src/client/clientRoute'
import { FeedbackSection, SidebarButton, SidebarSection } from '../sidebar'
import linkIcon from '@/public/chainSmall.svg'

export default function AdminSidebar({}: {}) {
  return (
    <>
      <div className='flex flex-col gap-4 px-2 pt-3 pb-4 border-r border-gray-200 bg-gray-25'>
        <SidebarSection title='Analytics'>
          <SidebarButton title='Analytics Dashboard' icon={linkIcon} link={AdminRoute.AnalyticsDashboard} />
          <SidebarButton title='Analytics Reports' icon={linkIcon} link={AdminRoute.AnalyticsReports} />
          <SidebarButton title='Search Console' icon={linkIcon} link={AdminRoute.SearchConsole} />
        </SidebarSection>
        <SidebarSection className='flex-1' title='Debug'>
          <SidebarButton title='Server Logs' icon={linkIcon} link={AdminRoute.ServerLogs} />
        </SidebarSection>
        <FeedbackSection />
      </div>
    </>
  )
}
