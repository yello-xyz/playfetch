import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import path from 'path'
import { getUserForID } from './datastore/users'
import { getProjectName } from './datastore/projects'
import ClientRoute, {
  ProjectSettingsRoute,
  UserSettingsRoute,
  WorkspaceRoute,
  WorkspaceSettingsRoute,
} from '@/src/common/clientRoute'
import { getWorkspaceName } from './datastore/workspaces'
import { Scope, User } from '@/types'
import { Capitalize, FormatCost, FormatDate } from '@/src/common/formatting'
import { getAccessingUserIDs } from './datastore/access'
import buildURLForRoute from './routing'

export const GetEmailServerConfig = () => {
  const config = {
    host: process.env.NOREPLY_EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.NOREPLY_EMAIL_PORT ?? '587'),
    auth: {
      user: process.env.NOREPLY_EMAIL_USER,
      pass: process.env.NOREPLY_EMAIL_PASSWORD,
    },
    tls: { ciphers: 'SSLv3' },
  }
  console.log(config)
  return config
}

export const GetNoReplyFromAddress = (deletegatedFrom?: string) =>
  `"${deletegatedFrom ? `${deletegatedFrom} (via PlayFetch)` : 'PlayFetch'}" <no-reply@playfetch.ai>`

async function sendMail(to: string, subject: string, text: string, html: string, delegatedFrom?: string) {
  const transporter = nodemailer.createTransport(GetEmailServerConfig())

  await transporter.sendMail({ from: GetNoReplyFromAddress(delegatedFrom), to, subject, text, html })
}

function resolveContent(fileName: string, fileType: 'txt' | 'html', variables: { [key: string]: string }) {
  const templatePath = path.join(process.cwd(), 'templates', `${fileName}.${fileType}`)
  let content = readFileSync(templatePath, 'utf8')
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value)
  })
  return content
}

export async function sendBudgetNotificationEmails(
  scope: Scope,
  scopeID: number,
  limit: number,
  hardLimit: number | null = null
) {
  const [ownerIDs] = scope === 'user' ? [[]] : await getAccessingUserIDs(scopeID, scope)
  if (ownerIDs.length > 0) {
    const name = scope === 'project' ? await getProjectName(scopeID) : await getWorkspaceName(scopeID)
    for (const ownerID of ownerIDs) {
      const settingsRoute =
        scope === 'project' ? ProjectSettingsRoute(scopeID, 'usage') : WorkspaceSettingsRoute(scopeID, ownerID, 'usage')
      await sendBudgetNotificationEmail(scope, ownerID, settingsRoute, name, limit, hardLimit)
    }
  } else {
    await sendBudgetNotificationEmail(scope, scopeID, UserSettingsRoute('usage'), null, limit, hardLimit)
  }
}

async function sendBudgetNotificationEmail(
  scope: Scope,
  userID: number,
  settingsRoute: string,
  name: string | null,
  limit: number,
  hardLimit: number | null = null
) {
  const user = await getUserForID(userID)

  const limitName = hardLimit ? 'usage threshold' : 'usage limit'
  const suffix = name ? ` for ${scope} “${name}”` : ''
  const plainSuffix = suffix.replaceAll('“', '"').replaceAll('”', '"')
  const subject = `Monthly ${limitName} reached${plainSuffix}`

  const title = `You have reached a ${limitName} on PlayFetch`
  const paragraphs = [
    `The monthly ${limitName} of ${FormatCost(limit)} has now been reached ${suffix}.`,
    hardLimit
      ? `Requests will continue to be processed unless you reach the usage limit of ${FormatCost(hardLimit)}.`
      : `Subsequent request will not be processed until the end of the month unless you increase your limit.`,
    `You can increase your ${limitName} in the ${Capitalize(scope)} Settings.`,
  ]
  const configurator = scope === 'user' ? 'you' : `a ${scope} owner`

  const variables = {
    __TITLE__: title,
    __FIRST_PARAGRAPH__: paragraphs[0],
    __SECOND_PARAGRAPH__: paragraphs[1],
    __THIRD_PARAGRAPH__: paragraphs[2],
    __SETTINGS_LINK__: buildURLForRoute(settingsRoute),
    __CONFIGURATOR__: configurator,
  }

  await sendMail(
    user.email,
    subject,
    resolveContent('budget', 'txt', variables),
    resolveContent('budget', 'html', variables)
  )
}

export async function sendInviteEmail(
  fromUserID: number,
  toEmail: string,
  objectID: number,
  kind: 'project' | 'workspace'
) {
  const inviter = await getUserForID(fromUserID)
  const objectName = kind === 'project' ? await getProjectName(objectID) : await getWorkspaceName(objectID)
  const inviteRoute = kind === 'project' ? ClientRoute.SharedProjects : WorkspaceRoute(objectID, 0)

  const variables = {
    __ENTITY_NAME__: kind,
    __INVITER_NAME__: inviter.fullName,
    __INVITER_SUFFIX__: inviter.fullName !== inviter.email ? ` (${inviter.email})` : '',
    __INVITER_EMAIL__: inviter.email,
    __PROJECT_NAME__: objectName,
    __INVITATION_LINK__: buildURLForRoute(inviteRoute),
  }

  await sendMail(
    toEmail,
    `${Capitalize(kind)} shared with you: "${objectName}"`,
    resolveContent('invite', 'txt', variables),
    resolveContent('invite', 'html', variables),
    inviter.fullName
  )
}

export async function sendCommentsEmail(
  toEmail: string,
  commentBlocks: {
    parentName: string
    projectName: string
    parentRoute: string
    comments: {
      commenter: User
      timestamp: number
      text: string
    }[]
  }[]
) {
  const anyProjectName = commentBlocks[0].projectName
  const anyComment = commentBlocks[0].comments[0]

  const contentForType = (type: 'txt' | 'html') =>
    resolveContent('comments', type, {
      __ANY_COMMENTER_EMAIL__: anyComment.commenter.email,
      __COMMENT_BLOCKS__: commentBlocks
        .map(({ parentName, projectName, parentRoute, comments }) =>
          resolveContent('commentBlock', type, {
            __PARENT_NAME__: parentName,
            __PARENT_LINK__: buildURLForRoute(parentRoute),
            __PROJECT_NAME__: projectName,
            __COMMENTS__: comments
              .map(({ commenter, timestamp, text }) =>
                resolveContent('comment', type, {
                  __COMMENTER_NAME__: commenter.fullName,
                  __COMMENTER_SUFFIX__: commenter.fullName !== commenter.email ? ` (${commenter.email})` : '',
                  __COMMENT_DATE__: FormatDate(timestamp),
                  __COMMENT_TEXT__: text,
                })
              )
              .join('\n'),
          })
        )
        .join('\n'),
    })

  await sendMail(
    toEmail,
    `New comments on project "${anyProjectName}"`,
    contentForType('txt'),
    contentForType('html'),
    anyComment.commenter.fullName
  )
}
