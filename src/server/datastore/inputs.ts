import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getFilteredEntityID,
  getID,
  runTransactionWithExponentialBackoff,
} from './datastore'
import { InputValues } from '@/types'
import { ensurePromptAccess } from './prompts'
import { ensureChainAccess } from './chains'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { ExtractUnboundChainInputs } from '@/components/chainNodeEditor'

export async function migrateInputs(postMerge: boolean) {
  const datastore = getDatastore()
  const [allInputs] = await datastore.runQuery(datastore.createQuery(Entity.INPUT))
  for (const [index, inputData] of allInputs.entries()) {
    const inputID = getID(inputData)
    console.log('processing input', inputData.name, inputID, `(${index + 1}/${allInputs.length})`)
    const projectID = inputData.projectID
    if (!projectID) {
      console.log('skipping', inputData.name, 'for project', inputID)
      continue
    }
    if (postMerge) {
      console.log('deleting', inputData.name, 'for project', inputID)
      await datastore.delete(buildKey(Entity.INPUT, inputID))
    } else {
      const prompts = await getEntities(Entity.PROMPT, 'projectID', projectID)
      for (const prompt of prompts) {
        const promptID = getID(prompt)
        const previousInputID = await getFilteredEntityID(
          Entity.INPUT,
          and([buildFilter('parentID', promptID), buildFilter('name', inputData.name)])
        )
        if (previousInputID) {
          console.log('skipping', inputData.name, 'for prompt', promptID, 'with previous input', inputID)
          continue
        }
        const variables = [] as string[]
        const versions = await getEntities(Entity.VERSION, 'promptID', promptID)
        for (const version of versions) {
          variables.push(...ExtractPromptVariables(version?.prompt ?? ''))
        }
        if (variables.includes(inputData.name)) {
          console.log('saving', inputData.name, 'for prompt', promptID)
          await datastore.save(toInputData(promptID, inputData.name, JSON.parse(inputData.values)))
        }
      }
      const chains = await getEntities(Entity.CHAIN, 'projectID', projectID)
      for (const chain of chains) {
        const chainID = getID(chain)
        const previousInputID = await getFilteredEntityID(
          Entity.INPUT,
          and([buildFilter('parentID', chainID), buildFilter('name', inputData.name)])
        )
        if (previousInputID) {
          console.log('skipping', inputData.name, 'for chain', chainID, 'with previous input', inputID)
          continue
        }
        const variables = ExtractUnboundChainInputs(JSON.parse(chain.items))
        if (variables.includes(inputData.name)) {
          console.log('saving', inputData.name, 'for chain', chainID)
          await datastore.save(toInputData(chainID, inputData.name, JSON.parse(inputData.values)))
        }
      }
    }
  }
  console.log('DONE')
}

const toInputData = (parentID: number, name: string, values: string[], inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { parentID, name, values: JSON.stringify(values) },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(
  userID: number,
  parentID: number,
  parentType: 'prompt' | 'chain',
  name: string,
  values: string[]
) {
  switch (parentType) {
    case 'prompt':
      await ensurePromptAccess(userID, parentID)
      break
    case 'chain':
      await ensureChainAccess(userID, parentID)
      break
  }
  await runTransactionWithExponentialBackoff(async transaction => {
    const query = transaction
      .createQuery(Entity.INPUT)
      .filter(and([buildFilter('parentID', parentID), buildFilter('name', name)]))
      .select('__key__')
      .limit(1)
    const [[inputKey]] = await transaction.runQuery(query)
    const inputID = inputKey ? getID(inputKey) : undefined
    transaction.save(toInputData(parentID, name, values, inputID))
  })

}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getTrustedParentInputValues(parentID: number) {
  const entities = await getEntities(Entity.INPUT, 'parentID', parentID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}
