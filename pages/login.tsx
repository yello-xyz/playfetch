import { Inter } from 'next/font/google'
import { withSession } from '@/server/session'
import EmailInput from '@/client/EmailInput'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withSession(function getServerSideProps({ req }) {
  if (req.session.user) {
    return { redirect: { destination: '/', permanent: false } }
  } else {
    return { props: { blah: 2 } }
  }
})

export default function Login() {
  return (
    <main className={`flex flex-col gap-4 p-10 align-items: flex-start ${inter.className}`}>
      <EmailInput />
    </main>
  )
}
