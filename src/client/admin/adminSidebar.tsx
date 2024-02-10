import { SidebarButton, SidebarSection } from '../components/sidebar'
import linkIcon from '@/public/chain.svg'
import userIcon from '@/public/user.svg'
import fileIcon from '@/public/file.svg'

export default function AdminSidebar({
  onSelectWaitlist,
  onSelectActiveUsers,
  onSelectRecentProjects,
  analyticsLinks,
  debugLinks,
}: {
  onSelectWaitlist: () => void
  onSelectActiveUsers: () => void
  onSelectRecentProjects: () => void
  analyticsLinks: [string, string]
  debugLinks: [string, string]
}) {
  return (
    <>
      <div className='flex flex-col gap-4 px-2 pt-3 pb-4 overflow-y-auto border-r border-gray-200 bg-gray-25'>
        <SidebarSection title='Manage Access'>
          <SidebarButton title='Waitlist' icon={userIcon} onClick={onSelectWaitlist} />
        </SidebarSection>
        <SidebarSection title='Recent Activity'>
          <SidebarButton title='Active Users' icon={userIcon} onClick={onSelectActiveUsers} />
          <SidebarButton title='Active Projects' icon={fileIcon} onClick={onSelectRecentProjects} />
        </SidebarSection>
        <SidebarSection title='Analytics'>
          {analyticsLinks.map(([title, link], index) => (
            <LinkButton key={index} title={title} link={link} />
          ))}
        </SidebarSection>
        <SidebarSection title='Debug'>
          {debugLinks.map(([title, link], index) => (
            <LinkButton key={index} title={title} link={link} />
          ))}
        </SidebarSection>
      </div>
    </>
  )
}

const LinkButton = ({ title, link }: { title: string; link: string }) => (
  <SidebarButton title={title} icon={linkIcon} link={link} target='_blank' prefetch={false} />
)
