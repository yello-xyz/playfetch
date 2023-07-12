import { NextApiRequest, NextApiResponse } from "next"

async function stream(_: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'text/event-stream;charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Content-Encoding', 'none')

  res.write('first chunk')
  await new Promise(resolve => setTimeout(resolve, 3000))
  res.write('second chunk with newline\n')
  await new Promise(resolve => setTimeout(resolve, 3000))
  res.write('last chunk')
  await new Promise(resolve => setTimeout(resolve, 3000))

  res.end()
}

export default stream
