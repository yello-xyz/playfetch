import nodemailer from 'nodemailer'

export const GetNoReplyFromAddress = () => `"PlayFetch" <${process.env.NOREPLY_EMAIL_USER}>`

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.NOREPLY_EMAIL_USER,
      pass: process.env.NOREPLY_EMAIL_PASSWORD,
    },
    tls: { ciphers: 'SSLv3' },
  })

  await transporter.sendMail({ from: GetNoReplyFromAddress(), to, subject, text, html })
}
