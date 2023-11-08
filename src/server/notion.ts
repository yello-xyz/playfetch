import { OnboardingResponse } from '@/types'
import { saveUser } from './datastore/users'
import { Client } from '@notionhq/client'

const NotionClient = new Client({ auth: process.env.NOTION_TOKEN })

const addContactToWaitlist = (name: string, email: string) =>
  NotionClient.pages.create({
    parent: { type: 'database_id', database_id: process.env.NOTION_WAITLIST_PAGE_ID ?? '' },
    properties: {
      Name: { type: 'title', title: [{ type: 'text', text: { content: name } }] },
      Email: { type: 'email', email },
      Tags: { type: 'multi_select', multi_select: [{ name: 'waitlist' }] },
      Source: { type: 'select', select: { name: 'Waitlist' } },
    },
  })

export default async function signUpNewUser(email: string, fullName: string) {
  const isNewUser = await saveUser(email, fullName)
  if (isNewUser) {
    await addContactToWaitlist(fullName, email)
  }
}

export const addOnboardingResponse = (email: string, name: string, response: OnboardingResponse) =>
  NotionClient.pages.create({
    parent: { type: 'database_id', database_id: process.env.NOTION_ONBOARDING_PAGE_ID ?? '' },
    properties: {
      Name: { type: 'title', title: [{ type: 'text', text: { content: name } }] },
      Email: { type: 'email', email },
      ...selectIfDefined('Role', response.role),
      ...multiSelect('Use Case', response.useCase),
      ...richTextIfDefined('Other Use Case', response.otherUseCase),
      ...selectIfDefined('Area', response.area),
      ...richTextIfDefined('Other Area', response.otherArea),
    },
  })

const select = (label: string, name: string) => ({
  [label]: {
    type: 'select',
    select: { name },
  },
})

const selectIfDefined = (label: string, name: string | undefined) => (name ? select(label, name) : {})

const multiSelect = (label: string, obj: { [key: string]: boolean }) => ({
  [label]: {
    type: 'multi_select',
    multi_select: Object.keys(obj)
      .filter(key => obj[key])
      .map(key => ({ name: key })),
  },
})

const richText = (label: string, content: string) => ({
  [label]: {
    type: 'rich_text',
    rich_text: [{ type: 'text', text: { content } }],
  },
})

const richTextIfDefined = (label: string, content: string | undefined) => (content ? richText(label, content) : {})
