import {
  InputPriceForModel,
  OutputPriceForModel,
  PriceUnitForProvider,
  ProviderForModel,
} from '@/src/common/providerMetadata'
import { LanguageModel } from '@/types'
import { encode } from 'gpt-3-encoder'

export const CostForModel = (model: LanguageModel, input: string, output: string) => {
  const million = 1000000
  const inputPrice = InputPriceForModel(model)
  const outputPrice = OutputPriceForModel(model)
  switch (PriceUnitForProvider(ProviderForModel(model))) {
    case 'perMillionTokens':
      return (encode(input).length * inputPrice) / million + (encode(output).length * outputPrice) / million
    case 'perMillionCharacters':
      return (input.length * inputPrice) / million + (output.length * outputPrice) / million
  }
}
