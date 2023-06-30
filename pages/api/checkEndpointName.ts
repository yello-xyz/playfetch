import { CheckValidURLPath, ToCamelCase } from '@/common/formatting'
import { withLoggedInSessionRoute } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'
import { checkCanSaveEndpoint } from '@/server/datastore/endpoints'

async function checkEndpointName(req: NextApiRequest, res: NextApiResponse<boolean>) {
  const promptID = req.body.promptID
  const projectURLPath = req.body.projectURLPath
  const name = req.body.name

  const urlPath = ToCamelCase(name)
  const available = CheckValidURLPath(urlPath) && (await checkCanSaveEndpoint(promptID, urlPath, projectURLPath))

  res.json(available)
}

export default withLoggedInSessionRoute(checkEndpointName)
