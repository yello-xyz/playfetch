import { CheckValidURLPath, ToCamelCase } from "@/common/formatting"
import { checkCanSaveEndpoint } from "@/server/datastore"
import { withLoggedInSessionRoute } from "@/server/session"
import { NextApiRequest, NextApiResponse } from "next"
import { buildURLForClientRoute } from '@/server/routing'

async function checkEndpointName(req: NextApiRequest, res: NextApiResponse<{ url?: string }>) {
  const promptID = req.body.promptID
  const projectURLPath = req.body.projectURLPath
  const name = req.body.name

  const urlPath = ToCamelCase(name)
  const available = CheckValidURLPath(urlPath) && await checkCanSaveEndpoint(promptID, urlPath, projectURLPath)
  const url = available ? buildURLForClientRoute(`/${projectURLPath}/${urlPath}`, req.headers) : undefined

  res.json({ url })
}

export default withLoggedInSessionRoute(checkEndpointName)
