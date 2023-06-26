import { Inter } from 'next/font/google'
import { withAdminSession } from '@/server/session'
import TextInput from '@/client/textInput'
import api from '@/client/admin/api'
import { useState } from 'react'
import { PendingButton } from '@/client/button'
import { CheckValidEmail } from '@/common/formatting'
import Label from '@/client/label'

const inter = Inter({ subsets: ['latin'] })

const avatarColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500']

export const getServerSideProps = withAdminSession(async () => ({ props: {} }))

export default function Admin() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [addAsAdmin, setAddAsAdmin] = useState(false)

  const addUser = async () => {
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)]
    await api.addUser(email.trim(), fullName, randomColor, addAsAdmin)
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <TextInput label='Email' placeholder='Enter email address...' value={email} setValue={setEmail} />
      <TextInput label='Full Name' placeholder='Enter name...' value={fullName} setValue={setFullName} />
      <div className='flex items-center gap-2'>
        <input type='checkbox' id='admin' checked={addAsAdmin} onChange={() => setAddAsAdmin(!addAsAdmin)} />
        <Label htmlFor='admin'>Add as Admin</Label>
      </div>
      <PendingButton disabled={!CheckValidEmail(email) || !fullName.length} onClick={addUser}>
        Add User
      </PendingButton>
    </main>
  )
}
