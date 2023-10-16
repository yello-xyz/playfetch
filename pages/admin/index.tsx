import { withAdminSession } from '@/src/server/session'
import { User } from '@/types'
import { getUsersWithoutAccess } from '@/src/server/datastore/users'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
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
            <Waitlist initialWaitlistUsers={initialWaitlistUsers} />
          </div>
        </div>
      </main>
    </>
  )
}
