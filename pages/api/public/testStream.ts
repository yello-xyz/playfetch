import { withErrorRoute } from '@/src/server/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function testStream(req: NextApiRequest, res: NextApiResponse) {
  const { initialWait, initialMessage } = req.body

  res.setHeader('X-Accel-Buffering', 'no')

  if (initialMessage) {
    res.write(initialMessage)
  }
  if (initialWait) {
    await new Promise(resolve => setTimeout(resolve, Number(initialWait) * 1000))
  }
  const messages = Array.from({ length: 20 }, (_, index) => `Message ${index}\n`)
  for (const message of messages) {
    res.write(message)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  res.end()
}

export default withErrorRoute(testStream)
