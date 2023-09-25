import { saveUser } from './datastore/users'
import { Client } from '@notionhq/client'

const NotionClient = new Client({ auth: process.env.NOTION_TOKEN })

const addContactToWaitlist = (name: string, email: string) =>
  NotionClient.pages.create({
    parent: { type: 'database_id', database_id: process.env.NOTION_PAGE_ID ?? '' },
    properties: {
      Name: { type: 'title', title: [{ type: 'text', text: { content: name } }] },
      Email: { type: 'email', email },
      Tags: { type: 'multi_select', multi_select: [{ name: 'waitlist' }] },
    },
  })

export default async function signUpNewUser(email: string, fullName: string) {
  const isNewUser = await saveUser(email, fullName)
  if (isNewUser) {
    await addContactToWaitlist(fullName, email)
  }
}
