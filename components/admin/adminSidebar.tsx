import { AdminRoute } from '@/src/client/clientRoute'
import { SidebarButton, SidebarSection } from '../sidebar'
import linkIcon from '@/public/chain.svg'
import userIcon from '@/public/user.svg'

export default function AdminSidebar({
  onSelectWaitlist,
  onSelectActiveUsers,
}: {
  onSelectWaitlist: () => void
  onSelectActiveUsers: () => void
}) {
  return (
    <>
      <div className='flex flex-col gap-4 px-2 pt-3 pb-4 border-r border-gray-200 bg-gray-25'>
        <SidebarSection title='Manage Access'>
          <SidebarButton title='Waitlist' icon={userIcon} onClick={onSelectWaitlist} />
        </SidebarSection>
        <SidebarSection title='Analytics'>
          <SidebarButton title='Active Users' icon={userIcon} onClick={onSelectActiveUsers} />
          <SidebarButton
            title='Analytics Dashboard'
            icon={linkIcon}
            link={AdminRoute.AnalyticsDashboard}
            target='_blank'
          />
          <SidebarButton title='Analytics Reports' icon={linkIcon} link={AdminRoute.AnalyticsReports} target='_blank' />
          <SidebarButton title='Search Console' icon={linkIcon} link={AdminRoute.SearchConsole} target='_blank' />
        </SidebarSection>
        <SidebarSection title='Debug'>
          <SidebarButton title='Server Logs' icon={linkIcon} link={AdminRoute.ServerLogs} target='_blank' />
        </SidebarSection>
      </div>
    </>
  )
}
