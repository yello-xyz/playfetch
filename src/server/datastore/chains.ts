import { Chain } from '@/types'
import { Entity, buildKey, getDatastore, getKeyedEntity, toID } from './datastore'
import { ensureProjectAccess } from './projects'

export async function saveChain(userID: number, projectID: number, chain: Chain) {
  await ensureProjectAccess(userID, projectID)
  const chainData = toChainData(projectID, chain, new Date())
  await getDatastore().save(chainData)
  return toID(chainData)
}

export async function getChain(userID: number, chainID: number): Promise<Chain> {
  const chainData = await getKeyedEntity(Entity.CHAIN, chainID)
  if (!chainData) {
    throw new Error(`Chain with ID ${chainID} does not exist or user has no access`)
  }
  await ensureProjectAccess(userID, chainData.projectID)
  return toChain(chainData)
}

const toChainData = (projectID: number, chain: Chain, createdAt: Date, chainID?: number) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: { projectID, chain: JSON.stringify(chain), createdAt },
  excludeFromIndexes: ['chain'],
})

export const toChain = (data: any): Chain => JSON.parse(data.chain)
