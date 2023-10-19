import nodemailer from 'nodemailer'

export const GetEmailServerConfig = () => ({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.NOREPLY_EMAIL_USER,
    pass: process.env.NOREPLY_EMAIL_PASSWORD,
  },
  tls: { ciphers: 'SSLv3' },
})

export const GetNoReplyFromAddress = () => `"PlayFetch" <no-reply@playfetch.ai>`

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const transporter = nodemailer.createTransport(GetEmailServerConfig())

  await transporter.sendMail({ from: GetNoReplyFromAddress(), to, subject, text, html })
}
