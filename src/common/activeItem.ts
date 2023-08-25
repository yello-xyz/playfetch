import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  Chain,
  InputValues,
  Prompt,
  RawChainVersion,
  RawPromptVersion,
} from '@/types'

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
        usedAsEndpoint: versionIDsUsedAsEndpoints.includes(version.id),
      })),
      inputValues,
      users: project.users,
      availableLabels: project.availableLabels,
    }
  }
