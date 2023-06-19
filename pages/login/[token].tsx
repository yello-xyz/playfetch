import { withSession } from '@/server/session'
import { unsealData } from 'iron-session'
import ClientRoute, { ParseQuery, Redirect } from '@/client/clientRoute'
import { markUserLogin } from '@/server/datastore/users'

export const getServerSideProps = withSession(async context => {
  const { token } = ParseQuery(context.query)
  const seal = Buffer.from(token ?? '', 'base64').toString()
  const { id } = (await unsealData(seal, { password: process.env.TOKEN_SECRET ?? '' })) as { id: number }
  if (id) {
    const user = await markUserLogin(id)
    if (user) {
      context.req.session.user = user
      await context.req.session.save()
      return Redirect(ClientRoute.Home)
    }
  }
  return Redirect(ClientRoute.Login)
})

export default function Token() {
  return null
}
