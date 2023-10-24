import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  Chain,
  Endpoint,
  InputValues,
  Prompt,
  RawChainVersion,
  RawPromptVersion,
} from '@/types'

export const CompareItem = 'compare'
export const EndpointsItem = 'endpoints'
export type ActiveItem = ActivePrompt | ActiveChain | typeof CompareItem | typeof EndpointsItem

export const IsEndpoint = (item: ActivePrompt | ActiveChain | Endpoint | undefined): item is Endpoint =>
  !!item && 'urlPath' in item

export const BuildActivePrompt =
  (project: ActiveProject) =>
  ({
    prompt,
    versions,
    inputValues,
  }: {
    prompt: Prompt
    versions: RawPromptVersion[]
    inputValues: InputValues
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
