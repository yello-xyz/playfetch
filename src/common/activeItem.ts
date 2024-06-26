import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  ActiveTable,
  Chain,
  Endpoint,
  InputValues,
  Prompt,
  RawChainVersion,
  RawPromptVersion,
  Table,
} from '@/types'

export const CompareItem = 'compare'
export const EndpointsItem = 'endpoints'
export const SettingsItem = 'settings'
export type ActiveItem =
  | ActivePrompt
  | ActiveChain
  | ActiveTable
  | typeof CompareItem
  | typeof EndpointsItem
  | typeof SettingsItem

export const IsEndpoint = (item: ActivePrompt | ActiveChain | ActiveTable | Endpoint | undefined): item is Endpoint =>
  !!item && 'urlPath' in item

export const BuildActivePrompt =
  (project: ActiveProject) =>
  ({
    prompt,
    versions,
    inputValues,
    canSuggestImprovements,
  }: {
    prompt: Prompt
    versions: RawPromptVersion[]
    inputValues: InputValues
    canSuggestImprovements: boolean
  }): ActivePrompt => {
    const chainReferencedItemIDs = {} as { [id: number]: string }
    project.chains.forEach(chain =>
      chain.referencedItemIDs.forEach(id => {
        chainReferencedItemIDs[id] = chain.name
      })
    )

    const versionIDsUsedAsEndpoints = project.endpoints
      .map(endpoint => endpoint.versionID)
      .filter(versionID => !!versionID)

    return {
      ...prompt,
      versions: versions.map(version => ({
        ...version,
        comments: project.comments.filter(comment => comment.versionID === version.id),
        usedInChain: chainReferencedItemIDs[version.id] ?? null,
        usedAsEndpoint: versionIDsUsedAsEndpoints.includes(version.id),
      })),
      inputValues,
      canSuggestImprovements,
      users: project.users,
      availableLabels: project.availableLabels,
    }
  }

export const BuildActiveChain =
  (project: ActiveProject) =>
  ({
    chain,
    versions,
    inputValues,
  }: {
    chain: Chain
    versions: RawChainVersion[]
    inputValues: InputValues
  }): ActiveChain => {
    const versionIDsUsedAsEndpoints = project.endpoints
      .map(endpoint => endpoint.versionID)
      .filter(versionID => !!versionID)

    return {
      ...chain,
      versions: versions.map(version => ({
        ...version,
        comments: project.comments.filter(comment => comment.versionID === version.id),
        usedAsEndpoint: versionIDsUsedAsEndpoints.includes(version.id),
      })),
      inputValues,
      users: project.users,
      availableLabels: project.availableLabels,
    }
  }

export const BuildActiveTable = ({ table, inputValues }: { table: Table; inputValues: InputValues }): ActiveTable => ({
  ...table,
  inputValues,
})
