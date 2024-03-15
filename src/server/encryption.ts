import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const ivLength = 16
const getEncryptionKey = () => Buffer.from(process.env.ENCRYPTION_KEY ?? '', 'hex')

export const encrypt = (value: string) => {
  const iv = crypto.randomBytes(ivLength)
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(getEncryptionKey()), iv)
  let encrypted = cipher.update(value)

  return Buffer.concat([iv, encrypted, cipher.final()]).toString('hex')
}

export const decrypt = (value: string) => {
  let iv = Buffer.from(value.substring(0, 2 * ivLength), 'hex')
  let encrypted = Buffer.from(value.substring(2 * ivLength), 'hex')
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(getEncryptionKey()), iv)
  let decrypted = decipher.update(encrypted)

  return Buffer.concat([decrypted, decipher.final()]).toString()
}
