import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import path from 'path'
import { getUserForID } from './datastore/users'
import { getProjectNameForID } from './datastore/projects'
import ClientRoute, { WorkspaceRoute } from '../common/clientRoute'
import { getWorkspaceNameForID } from './datastore/workspaces'
import { User } from '@/types'
import { Capitalize, FormatDate } from '../common/formatting'

export const GetEmailServerConfig = () => ({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.NOREPLY_EMAIL_USER,
    pass: process.env.NOREPLY_EMAIL_PASSWORD,
  },
  tls: { ciphers: 'SSLv3' },
})

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

export async function sendInviteEmail(
  fromUserID: number,
  toEmail: string,
  objectID: number,
  kind: 'project' | 'workspace'
) {
  const inviter = await getUserForID(fromUserID)
  const objectName = kind === 'project' ? await getProjectNameForID(objectID) : await getWorkspaceNameForID(objectID)
  const inviteRoute = kind === 'project' ? ClientRoute.SharedProjects : WorkspaceRoute(objectID, 0)

  const variables = {
    __ENTITY_NAME__: kind,
    __INVITER_NAME__: inviter.fullName,
    __INVITER_SUFFIX__: inviter.fullName !== inviter.email ? ` (${inviter.email})` : '',
    __INVITER_EMAIL__: inviter.email,
    __PROJECT_NAME__: objectName,
    __INVITATION_LINK__: `${process.env.NEXTAUTH_URL}${inviteRoute}`,
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
            __PARENT_LINK__: `${process.env.NEXTAUTH_URL}${parentRoute}`,
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
