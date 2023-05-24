import { savePrompt } from '@/server/datastore'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function addPrompt(req: NextApiRequest, res: NextApiResponse) {
  await savePrompt(req.query.prompt as string)
  
  res.json({})
}
