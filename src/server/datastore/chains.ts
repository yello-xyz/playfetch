import { Chain } from '@/types'
import { Entity, buildKey, getDatastore, getKeyedEntity, toID } from './datastore'
import { ensureProjectAccess } from './projects'

export async function saveChain(userID: number, projectID: number, chain: Chain) {
  await ensureProjectAccess(userID, projectID)
  const chainData = toChainData(projectID, chain, new Date())
  await getDatastore().save(chainData)
  return toID(chainData)
}

export async function getChain(chainID: number): Promise<Chain> {
  const chainData = await getKeyedEntity(Entity.CHAIN, chainID)
  return toChain(chainData)
}

const toChainData = (projectID: number, chain: Chain, createdAt: Date, chainID?: number) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: { projectID, chain: JSON.stringify(chain), createdAt },
  excludeFromIndexes: ['chain'],
})

export const toChain = (data: any): Chain => JSON.parse(data.chain)
