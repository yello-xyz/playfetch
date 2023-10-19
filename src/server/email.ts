import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import path from 'path'
import { getUserForID } from './datastore/users'
import { getProjectNameForID } from './datastore/projects'
import ClientRoute, { WorkspaceRoute } from '../common/clientRoute'
import { getWorkspaceNameForID } from './datastore/workspaces'

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

function resolveContent(fileName: string, variables: { [key: string]: string }) {
  const templatePath = path.join(process.cwd(), 'templates', fileName)
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
    __INVITER_EMAIL__: inviter.email,
    __PROJECT_NAME__: objectName,
    __INVITATION_LINK__: `${process.env.NEXTAUTH_URL}${inviteRoute}`,
  }

  await sendMail(
    toEmail,
    `${kind[0].toUpperCase()}${kind.slice(1)} shared with you: "${objectName}"`,
    resolveContent('invite.txt', variables),
    resolveContent('invite.html', variables),
    inviter.fullName
  )
}
