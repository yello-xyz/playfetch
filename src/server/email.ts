import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import path from 'path'
import { getUserForID } from './datastore/users'
import { getUserProjectForID } from './datastore/projects'
import ClientRoute from '../common/clientRoute'

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

export async function sendProjectInviteEmail(fromUserID: number, toEmail: string, projectID: number) {
  const inviter = await getUserForID(fromUserID)
  const project = await getUserProjectForID(fromUserID, projectID)

  const variables = {
    __INVITER_NAME__: inviter.fullName,
    __INVITER_EMAIL__: inviter.email,
    __PROJECT_NAME__: project.name,
    __INVITATION_LINK__: `${process.env.NEXTAUTH_URL}${ClientRoute.SharedProjects}`,
  }

  await sendMail(
    toEmail,
    `Project shared with you: "${project.name}"`,
    resolveContent('projectInvite.txt', variables),
    resolveContent('projectInvite.html', variables),
    inviter.fullName
  )
}
