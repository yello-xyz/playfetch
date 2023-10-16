import { withAdminSession } from '@/src/server/session'
import { ReactNode } from 'react'
import { User } from '@/types'
import { getUsersWithoutAccess } from '@/src/server/datastore/users'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import { AdminRoute } from '@/src/client/clientRoute'
import Link from 'next/link'
import Icon from '@/components/icon'
import chainIcon from '@/public/chainSmall.svg'
import AdminSidebar from '@/components/admin/adminSidebar'
import Waitlist from '@/components/admin/waitlist'

export const getServerSideProps = withAdminSession(async () => {
  const initialWaitlistUsers = await getUsersWithoutAccess()

  return { props: { initialWaitlistUsers } }
})

export default function Admin({ initialWaitlistUsers }: { initialWaitlistUsers: User[] }) {
  return (
    <>
      <main className='flex flex-col h-screen text-sm'>
        <TopBar>
          <TopBarBackItem />
          <span className='text-base font-medium'>Admin</span>
          <TopBarAccessoryItem />
        </TopBar>
        <div className='flex items-stretch flex-1 overflow-hidden'>
          <AdminSidebar />
          <div className='flex flex-col flex-1 bg-gray-25'>
            <div className='flex flex-col gap-4 p-4'>
            <ExternalLink href={AdminRoute.AnalyticsDashboard}>Analytics Dashboard</ExternalLink>
            <ExternalLink href={AdminRoute.AnalyticsReports}>Analytics Reports</ExternalLink>
            <ExternalLink href={AdminRoute.SearchConsole}>Search Console</ExternalLink>
            <ExternalLink href={AdminRoute.ServerLogs}>Server Logs</ExternalLink>
            </div>
            <Waitlist initialWaitlistUsers={initialWaitlistUsers} />
          </div>
        </div>
      </main>
    </>
  )
}

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link className='flex items-center gap-1 underline' href={href} target='_blank'>
    <Icon className='-rotate-45' icon={chainIcon} />
    {children}
  </Link>
)
