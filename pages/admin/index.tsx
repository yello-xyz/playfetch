import { Inter } from 'next/font/google'
import { withAdminSession } from '@/server/session'
import TextInput from '@/client/labeledTextInput'
import { Checkbox, Label } from 'flowbite-react'
import api from '@/client/admin/api'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { CheckValidEmail } from '@/common/formatting'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withAdminSession(async () => ({ props: {} }))

export default function Admin() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [addAsAdmin, setAddAsAdmin] = useState(false)

  const addUser = async () => {
    await api.addUser(email, fullName, addAsAdmin)
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <TextInput label='Email' placeholder='Enter email address...' value={email} setValue={setEmail} />
      <TextInput label='Full Name' placeholder='Enter name...' value={fullName} setValue={setFullName} />
      <div className='flex items-center gap-2'>
        <Checkbox id='admin' checked={addAsAdmin} onChange={() => setAddAsAdmin(!addAsAdmin)} />
        <Label htmlFor='admin'>Add as Admin</Label>
      </div>
      <PendingButton disabled={!CheckValidEmail(email) || !fullName.length} onClick={addUser}>
        Add User
      </PendingButton>
    </main>
  )
}
