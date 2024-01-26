import { withErrorRoute } from '@/src/server/session'
import { LINEAR_WEBHOOK_SIGNATURE_HEADER, LINEAR_WEBHOOK_TS_FIELD, LinearWebhooks } from '@linear/sdk'
import type { NextApiRequest, NextApiResponse } from 'next'

const parsePayload: (req: NextApiRequest) => Promise<Buffer> = (req: NextApiRequest) =>
  new Promise(resolve => {
    let data = ''
    req.on('data', chunk => (data += chunk))
    req.on('end', () => resolve(Buffer.from(data)))
  })

const webhook = new LinearWebhooks(process.env.LINEAR_APP_WEBHOOK_SECRET ?? '')

async function linear(req: NextApiRequest, res: NextApiResponse) {
  console.log('headers', req.headers)
  console.log('query', req.query)
  console.log('body', req.body)
  const signature = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER] as string | undefined
  if (signature) {
    const buffer = await parsePayload(req)
    console.log('buffer', buffer.toString())
    console.log('buffer parsed', JSON.parse(buffer.toString()))
    if (webhook.verify(buffer, signature, JSON.parse(buffer.toString())[LINEAR_WEBHOOK_TS_FIELD])) {
      console.log('verified')
    }
  }
  res.status(200).json({})
}

export default withErrorRoute(linear)
