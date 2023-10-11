import { withAdminSession } from '@/src/server/session'
import TextInput from '@/components/textInput'
import api from '@/src/client/admin/api'
import { Fragment, ReactNode, useState } from 'react'
import { PendingButton } from '@/components/button'
import { CheckValidEmail } from '@/src/common/formatting'
import { User } from '@/types'
import { getUsersWithoutAccess } from '@/src/server/datastore/users'
import Label from '@/components/label'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { UserAvatar } from '@/components/userSidebarItem'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import { AdminRoute } from '@/src/client/clientRoute'
import Link from 'next/link'
import Icon from '@/components/icon'
import chainIcon from '@/public/chainSmall.svg'

export const getServerSideProps = withAdminSession(async () => {
  const initialWaitlistUsers = await getUsersWithoutAccess()

  return { props: { initialWaitlistUsers } }
})

export default function Admin({ initialWaitlistUsers }: { initialWaitlistUsers: User[] }) {
  const [waitlistUsers, setWaitlistUsers] = useState<User[]>(initialWaitlistUsers)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [addedEmail, setAddedEmail] = useState('')
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [adding, setAdding] = useState(false)

  const promptAddUser = (email: string, fullName: string, callback?: () => Promise<void>) =>
    setDialogPrompt({
      title:
        'Grant user access? They will NOT be notified by email automatically ' +
        'and they will NOT automatically be added as a test user for Google Authentication.',
      confirmTitle: 'Proceed',
      callback: async () => {
        setAdding(true)
        await api.addUser(email.trim(), fullName.trim())
        setAddedEmail(email)
        await callback?.()
        setAdding(false)
      },
    })

  const addUser = () => promptAddUser(email, fullName)

  const grantWaitlistUserAccess = (user: User) =>
    promptAddUser(user.email, user.fullName, () => api.getWaitlistUsers().then(setWaitlistUsers))

  return (
    <>
      <main className='flex flex-col h-screen overflow-hidden text-sm'>
        <TopBar>
          <TopBarBackItem />
          <span className='text-base font-medium'>Admin</span>
          <TopBarAccessoryItem />
        </TopBar>
        <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto bg-gray-25'>
          <ExternalLink href={AdminRoute.AnalyticsDashboard}>Analytics Dashboard</ExternalLink>
          <ExternalLink href={AdminRoute.AnalyticsReports}>Analytics Reports</ExternalLink>
          <ExternalLink href={AdminRoute.SearchConsole}>Search Console</ExternalLink>
          <ExternalLink href={AdminRoute.ServerLogs}>Server Logs</ExternalLink>
          {addedEmail && <Label>Granted access to {addedEmail}</Label>}
          <div className='flex items-center gap-2'>
            <TextInput placeholder='Email' value={email} setValue={setEmail} />
            <TextInput placeholder='Full Name (optional)' value={fullName} setValue={setFullName} />
            <PendingButton title='Grant Access' disabled={!CheckValidEmail(email) || adding} onClick={addUser} />
          </div>
          {waitlistUsers.length > 0 && (
            <>
              <Label>Waitlist</Label>
              <div className='grid grid-cols-[28px_240px_minmax(0,1fr)_160px] w-full bg-white items-center gap-2 p-2 border-gray-200 border rounded-lg'>
                {waitlistUsers.map(user => (
                  <Fragment key={user.id}>
                    <UserAvatar user={user} />
                    <div className='overflow-hidden text-ellipsis'>{user.email}</div>
                    <div className='font-medium'>{user.fullName}</div>
                    <div className='flex justify-end'>
                      <PendingButton
                        title='Grant Access'
                        onClick={() => grantWaitlistUserAccess(user)}
                        disabled={adding}
                      />
                    </div>
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link className='flex items-center gap-1 underline' href={href} target='_blank'>
    <Icon className='-rotate-45' icon={chainIcon} />
    {children}
  </Link>
)
