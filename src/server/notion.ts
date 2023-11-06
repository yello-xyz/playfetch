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

const trueKeysAsNames = (obj: { [key: string]: boolean }) =>
  Object.keys(obj)
    .filter(key => obj[key])
    .map(key => ({ name: key }))

const richTextIfDefined = (label: string, content: string | undefined) =>
  content
    ? {
        [label]: {
          type: 'rich_text',
          rich_text: [{ type: 'text', text: { content: content } }],
        },
      }
    : {}

export const addOnboardingResponse = (email: string, name: string, response: OnboardingResponse) =>
  NotionClient.pages.create({
    parent: { type: 'database_id', database_id: process.env.NOTION_ONBOARDING_PAGE_ID ?? '' },
    properties: {
      Name: { type: 'title', title: [{ type: 'text', text: { content: name } }] },
      Email: { type: 'email', email },
      ...(response.role ? { Role: { type: 'select', select: { name: response.role! } } } : {}),
      'Use Case': { type: 'multi_select', multi_select: trueKeysAsNames(response.useCase) },
      ...richTextIfDefined('Other Use Case', response.otherUseCase),
      Area: { type: 'multi_select', multi_select: trueKeysAsNames(response.area) },
      ...richTextIfDefined('Other Area', response.otherArea),
    },
  })
