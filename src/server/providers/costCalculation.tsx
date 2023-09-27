import { InputPriceForModel, OutputPriceForModel } from '@/src/common/providerMetadata'
import { LanguageModel } from '@/types'
import { encode } from 'gpt-3-encoder'

export const CostForModel = (model: LanguageModel, input: string, output: string) =>
  (encode(input).length * InputPriceForModel(model)) / 1000000 +
  (encode(output).length * OutputPriceForModel(model)) / 1000000
