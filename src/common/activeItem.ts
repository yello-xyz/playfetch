import { IsPromptChainItem } from '@/components/chainNode'
import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  Chain,
  ChainItem,
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
    const versionIDsUsedInChains = {} as { [versionID: number]: string }
    project.chains.forEach(chain =>
      (chain.items as ChainItem[]).filter(IsPromptChainItem).forEach(item => {
        versionIDsUsedInChains[item.versionID] = chain.name
      })
    )

    const versionIDsUsedAsEndpoints = project.endpoints
      .map(endpoint => endpoint.versionID)
      .filter(versionID => !!versionID)

    return {
      ...prompt,
      versions: versions.map(version => ({
        ...version,
        usedInChain: versionIDsUsedInChains[version.id] ?? null,
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
