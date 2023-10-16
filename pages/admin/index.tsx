import { withAdminSession } from '@/src/server/session'
import { ActiveUser, User } from '@/types'
import { getActiveUsers, getUsersWithoutAccess } from '@/src/server/datastore/users'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import AdminSidebar from '@/components/admin/adminSidebar'
import Waitlist from '@/components/admin/waitlist'
import { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ActiveUsers from '@/components/admin/activeUsers'

type ActiveItem = 'waitlist' | 'activeUsers'

export const getServerSideProps = withAdminSession(async ({ query }) => {
  const { w: waitlist } = ParseNumberQuery(query)

  const initialActiveItem = waitlist ? 'waitlist' : 'activeUsers'

  const activeUsers = await getActiveUsers()
  const waitlistUsers = await getUsersWithoutAccess()

  return { props: { initialActiveItem, activeUsers, waitlistUsers } }
})

export default function Admin({
  initialActiveItem,
  activeUsers,
  waitlistUsers,
}: {
  initialActiveItem: ActiveItem
  activeUsers: ActiveUser[]
  waitlistUsers: User[]
}) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)

  const router = useRouter()

  const { w: waitlist } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    setActiveItem(waitlist ? 'waitlist' : 'activeUsers')
    setQuery(currentQueryState)
  }

  const selectItem = (item: ActiveItem) => {
    setActiveItem(item)
    router.push(`/admin${item === 'waitlist' ? '?w=1' : ''}`, undefined, { shallow: true })
  }

  return (
    <>
      <main className='flex flex-col h-screen text-sm'>
        <TopBar>
          <TopBarBackItem />
          <span className='text-base font-medium'>Admin</span>
          <TopBarAccessoryItem />
        </TopBar>
        <div className='flex items-stretch flex-1 overflow-hidden'>
          <AdminSidebar
            onSelectWaitlist={() => selectItem('waitlist')}
            onSelectActiveUsers={() => selectItem('activeUsers')}
          />
          <div className='flex flex-col flex-1 bg-gray-25'>
            {activeItem === 'activeUsers' && <ActiveUsers activeUsers={activeUsers} />}
            {activeItem === 'waitlist' && <Waitlist initialWaitlistUsers={waitlistUsers} />}
          </div>
        </div>
      </main>
    </>
  )
}
