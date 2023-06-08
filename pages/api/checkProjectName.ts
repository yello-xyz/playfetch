import { CheckValidURLPath, ProjectNameToURLPath } from "@/common/formatting"
import { getProjectIDFromURLPath } from "@/server/datastore"
import { withLoggedInSessionRoute } from "@/server/session"
import { NextApiRequest, NextApiResponse } from "next"

async function checkProjectName(req: NextApiRequest, res: NextApiResponse<boolean>) {
  const name = req.body.name
  const urlPath = ProjectNameToURLPath(name)
  const available = CheckValidURLPath(urlPath) && !(await getProjectIDFromURLPath(urlPath))
  res.json(available)
}

export default withLoggedInSessionRoute(checkProjectName)
