import { Inter } from 'next/font/google'
import { withAdminSession } from '@/src/server/session'
import TextInput from '@/components/textInput'
import api from '@/src/client/admin/api'
import { useState } from 'react'
import { PendingButton } from '@/components/button'
import { CheckValidEmail } from '@/src/common/formatting'
import Checkbox from '@/components/checkbox'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withAdminSession(async () => ({ props: {} }))

export default function Admin() {
  const [email, setEmail] = useState('')
  const [addAsAdmin, setAddAsAdmin] = useState(false)

  const addUser = async () => {
    await api.addUser(email.trim(), addAsAdmin)
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <TextInput label='Email' placeholder='Enter email address...' value={email} setValue={setEmail} />
      <Checkbox label='Add as Admin' id='admin' checked={addAsAdmin} setChecked={setAddAsAdmin} />
      <PendingButton disabled={!CheckValidEmail(email)} onClick={addUser}>
        Add User
      </PendingButton>
    </main>
  )
}
