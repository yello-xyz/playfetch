import { withAdminSession } from '@/src/server/session'
import TextInput from '@/components/textInput'
import api from '@/src/client/admin/api'
import { Fragment, useState } from 'react'
import { PendingButton } from '@/components/button'
import { CheckValidEmail } from '@/src/common/formatting'
import Checkbox from '@/components/checkbox'
import { User } from '@/types'
import { getWaitlistUsers } from '@/src/server/datastore/users'
import Label from '@/components/label'

export const getServerSideProps = withAdminSession(async () => {
  const waitlistUsers = await getWaitlistUsers()

  return { props: { waitlistUsers } }
})

export default function Admin({ waitlistUsers }: { waitlistUsers: User[] }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  const addUser = async () => {
    await api.addUser(email.trim(), fullName.trim())
  }

  const grantWaitlistUserAccess = async (user: User) => {
    await api.addUser(user.email, user.fullName)
  }

  return (
    <main className='flex flex-col items-start h-screen gap-4 p-10 overflow-hidden text-sm bg-gray-25'>
      <div className='flex items-center gap-2'>
      <TextInput placeholder='Email' value={email} setValue={setEmail} />
      <TextInput placeholder='Full Name (optional)' value={fullName} setValue={setFullName} />
      <PendingButton title='Add User to Allowlist' disabled={!CheckValidEmail(email)} onClick={addUser} />
      </div>
      {waitlistUsers.length > 0 && (
        <>
        <Label>Waitlist</Label>
        <div className='grid grid-cols-[160px_minmax(0,1fr)_120px] w-full overflow-y-auto bg-white items-center gap-8 p-2 pl-4 border-gray-200 border rounded-lg'>
          {waitlistUsers.map(user => (
            <Fragment key={user.id}>
              <div>{user.email}</div>
              <div className='font-medium'>{user.fullName}</div>
              <div>
                <PendingButton title='Grant Access' onClick={() => grantWaitlistUserAccess(user)} />
              </div>
            </Fragment>
          ))}
        </div>
        </>
      )}
    </main>
  )
}
