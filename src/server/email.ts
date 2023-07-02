import nodemailer from 'nodemailer'

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const fromAddress = process.env.NOREPLY_EMAIL_USER

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: fromAddress,
      pass: process.env.NOREPLY_EMAIL_PASSWORD,
    },
    tls: { ciphers: 'SSLv3' },
  })

  const from = `"PlayFetch" <${fromAddress}>`

  await transporter.sendMail({ from, to, subject, text, html })
}
