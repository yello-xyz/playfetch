import { Inter } from 'next/font/google'
import { withAdminSession } from '@/server/session'
import TextInput from '@/client/textInput'
import { Checkbox, Label } from 'flowbite-react'
import api from '@/client/admin/api'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withAdminSession(async () => ({ props: {} }))

export default function Admin() {
  const [addAsAdmin, setAddAsAdmin] = useState(false)

  const addUser = async (email: string) => {
    await api.addUser(email, addAsAdmin)
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <div className='flex items-center gap-2'>
        <Checkbox id='admin' checked={addAsAdmin} onChange={() => setAddAsAdmin(!addAsAdmin)} />
        <Label htmlFor='admin'>Add as Admin</Label>
      </div>
      <TextInput label='Email' placeholder='Enter email address...' buttonTitle='Add User' onSubmit={addUser} />
    </main>
  )
}
