import fileIcon from '@/public/file.svg'
import UserSidebarItem from '../userSidebarItem'
import { useLoggedInUser } from '@/src/client/context/userContext'
import { FeedbackSection, SidebarButton, SidebarSection } from '../sidebar'

export default function AdminSidebar({}: {}) {
  return (
    <>
      <div className='flex flex-col gap-4 px-2 pt-3 pb-4 border-r border-gray-200 bg-gray-25'>
        <SidebarSection className='flex-1'>
        </SidebarSection>
        <FeedbackSection />
      </div>
    </>
  )
}
