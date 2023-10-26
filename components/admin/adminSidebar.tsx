import { AdminRoute } from '@/src/common/clientRoute'
import { SidebarButton, SidebarSection } from '../sidebar'
import linkIcon from '@/public/chain.svg'
import userIcon from '@/public/user.svg'
import fileIcon from '@/public/file.svg'

export default function AdminSidebar({
  onSelectWaitlist,
  onSelectActiveUsers,
  onSelectRecentProjects,
}: {
  onSelectWaitlist: () => void
  onSelectActiveUsers: () => void
  onSelectRecentProjects: () => void
}) {
  return (
    <>
      <div className='flex flex-col gap-4 px-2 pt-3 pb-4 border-r border-gray-200 bg-gray-25'>
        <SidebarSection title='Manage Access'>
          <SidebarButton title='Waitlist' icon={userIcon} onClick={onSelectWaitlist} />
        </SidebarSection>
        <SidebarSection title='Recent Activity'>
          <SidebarButton title='Active Users' icon={userIcon} onClick={onSelectActiveUsers} />
          <SidebarButton title='Active Projects' icon={fileIcon} onClick={onSelectRecentProjects} />
        </SidebarSection>
        <SidebarSection title='Google Analytics'>
          <SidebarButton
            title='Dashboards'
            icon={linkIcon}
            link={AdminRoute.AnalyticsDashboard}
            target='_blank'
            prefetch={false}
          />
          <SidebarButton
            title='Reports'
            icon={linkIcon}
            link={AdminRoute.AnalyticsReports}
            target='_blank'
            prefetch={false}
          />
          <SidebarButton
            title='Search Console'
            icon={linkIcon}
            link={AdminRoute.SearchConsole}
            target='_blank'
            prefetch={false}
          />
        </SidebarSection>
        <SidebarSection title='Debug'>
          <SidebarButton
            title='Server Logs'
            icon={linkIcon}
            link={AdminRoute.ServerLogs}
            target='_blank'
            prefetch={false}
          />
        </SidebarSection>
      </div>
    </>
  )
}
