import api from '@/src/client/admin/api'
import { Fragment, useState } from 'react'
import { PendingButton } from '@/src/client/components/button'
import { CheckValidEmail } from '@/src/common/formatting'
import { User } from '@/types'
import Label from '@/src/client/components/label'
import Checkbox from '@/src/client/components/checkbox'
import TextInput from '@/src/client/components/textInput'
import ModalDialog, { DialogPrompt } from '@/src/client/components/modalDialog'
import UserAvatar from '@/src/client/users/userAvatar'

export default function Waitlist({ initialWaitlistUsers }: { initialWaitlistUsers: User[] }) {
  const [waitlistUsers, setWaitlistUsers] = useState<User[]>(initialWaitlistUsers)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [addedEmail, setAddedEmail] = useState('')
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [adding, setAdding] = useState(false)

  const promptAddUser = (email: string, fullName: string, asAdmin: boolean, callback?: () => Promise<void>) =>
    setDialogPrompt({
      title:
        'Grant user access? They will NOT be notified by email automatically ' +
        'and they will NOT automatically be added as a test user for Google Authentication.',
      confirmTitle: 'Proceed',
      callback: async () => {
        setAdding(true)
        await api.addUser(email.trim(), fullName.trim(), asAdmin)
        setAddedEmail(email)
        await callback?.()
        setAdding(false)
      },
    })

  const addUser = () => promptAddUser(email, fullName, asAdmin)

  const grantWaitlistUserAccess = (user: User) =>
    promptAddUser(user.email, user.fullName, false, () => api.getWaitlistUsers().then(setWaitlistUsers))

  const gridConfig = 'grid grid-cols-[28px_240px_minmax(0,1fr)_160px]'

  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        {addedEmail && <Label>Granted access to {addedEmail}</Label>}
        <div className='flex items-center gap-2'>
          <TextInput placeholder='Email' value={email} setValue={setEmail} />
          <TextInput placeholder='Full Name (optional)' value={fullName} setValue={setFullName} />
          <Checkbox label='Admin' checked={asAdmin} setChecked={setAsAdmin} />
          <PendingButton title='Grant Access' disabled={!CheckValidEmail(email) || adding} onClick={addUser} />
        </div>
        {waitlistUsers.length > 0 && (
          <>
            <Label>Waitlist</Label>
            <div className={`${gridConfig} w-full bg-white items-center gap-2 p-2 border-gray-200 border rounded-lg`}>
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
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
