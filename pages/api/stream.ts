import { NextApiRequest, NextApiResponse } from 'next'

async function stream(_: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-store"')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Content-Encoding', 'none')
  res.setHeader('Connection', 'keep-alive')

  res.status(202).write('first chunk')
  await new Promise(resolve => setTimeout(resolve, 3000))
  res.status(202).write('second chunk with newline\n')
  await new Promise(resolve => setTimeout(resolve, 3000))
  res.status(202).write('last chunk')
  await new Promise(resolve => setTimeout(resolve, 3000))

  res.end()
}

export default stream
