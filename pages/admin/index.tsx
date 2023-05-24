import { Inter } from 'next/font/google'
import { withAdminSession } from '@/server/session'
import TextInput from '@/client/labeledTextInput'
import { Checkbox, Label } from 'flowbite-react'
import api from '@/client/admin/api'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withAdminSession(async () => ({ props: {} }))

export default function Admin() {
  const [addAsAdmin, setAddAsAdmin] = useState(false)
  const [email, setEmail] = useState('')

  const addUser = async () => {
    await api.addUser(email, addAsAdmin)
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <TextInput label='Email' placeholder='Enter email address...' value={email} setValue={setEmail} />
      <div className='flex items-center gap-2'>
        <Checkbox id='admin' checked={addAsAdmin} onChange={() => setAddAsAdmin(!addAsAdmin)} />
        <Label htmlFor='admin'>Add as Admin</Label>
      </div>
      <PendingButton onClick={addUser}>Add User</PendingButton>
    </main>
  )
}
