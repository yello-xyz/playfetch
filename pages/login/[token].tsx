import { withSession } from '@/server/session'
import { unsealData } from 'iron-session'
import ClientRoute, { ParseQuery } from '@/client/clientRoute'
import { getUser } from '@/server/datastore'

export const getServerSideProps = withSession(async (context) => {
  const { token } = ParseQuery(context.query)
  const seal = Buffer.from(token, 'base64').toString()
  const { id } = await unsealData(seal, { password: process.env.TOKEN_SECRET ?? '' }) as { id: number }
  if (id) {
    const user = await getUser(id)
    if (user) {
      context.req.session.user = user
      await context.req.session.save()
      return { redirect: { destination: ClientRoute.Home, permanent: false } }
    }
  }
  return { redirect: { destination: ClientRoute.Login, permanent: false } }
})

export default function Token() {
  return null
}
