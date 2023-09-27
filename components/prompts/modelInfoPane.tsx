import { LanguageModel, ModelProvider } from '@/types'
import { PopupContent } from '../popupMenu'
import {
  DescriptionForModel,
  FullLabelForModel,
  IconForProvider,
  InputPriceForModel,
  LabelForProvider,
  MaxTokensForModel,
  OutputPriceForModel,
  PriceUnitForProvider,
  ProviderForModel,
  WebsiteLinkForModel,
} from '@/src/common/providerMetadata'
import Icon from '../icon'
import openInIcon from '@/public/openIn.svg'
import Link from 'next/link'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import { ProviderWarning } from './promptPanel'
import { FormatCost, FormatLargeInteger } from '@/src/common/formatting'

const priceSuffixForProvider = (provider: ModelProvider) => {
  switch (PriceUnitForProvider(provider)) {
    case 'perMillionTokens':
      return '/ 1M tokens'
    case 'perMillionCharacters':
      return '/ 1M characters'
  }
}

export default function ModelInfoPane({ model }: { model: LanguageModel }) {
  const checkProvider = useCheckProvider()

  const provider = ProviderForModel(model)
  const isProviderAvailable = checkProvider(provider)
  return (
    <PopupContent className='p-3 w-[480px] ml-7 flex flex-col gap-1'>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <span>{LabelForProvider(provider)} - </span>
        <span className='font-medium'>{FullLabelForModel(model, false)}</span>
        <div className='flex justify-end flex-1'>
          <Link className='flex items-center' href={WebsiteLinkForModel(model)} target='_blank'>
            <span className='text-gray-500'>Website</span>
            <Icon icon={openInIcon} />
          </Link>
        </div>
      </div>
      <HorizontalBorder />
      <div className='py-1 text-gray-500'>{DescriptionForModel(model)}</div>
      <div className='grid grid-cols-[140px_180px] text-gray-500 gap-y-0.5 pb-1'>
        <span className='font-medium'>Context</span>
        <span>{FormatLargeInteger(MaxTokensForModel(model))} tokens</span>
        {(InputPriceForModel(model) > 0 || OutputPriceForModel(model) > 0) && (
          <>
            <HorizontalBorder />
            <HorizontalBorder />
            <span className='font-medium'>Input Pricing</span>
            <span>
              {FormatCost(InputPriceForModel(model))} {priceSuffixForProvider(provider)}
            </span>
            <HorizontalBorder />
            <HorizontalBorder />
            <span className='font-medium'>Output Pricing</span>
            <span>
              {FormatCost(OutputPriceForModel(model))} {priceSuffixForProvider(provider)}
            </span>
          </>
        )}
      </div>
      {!isProviderAvailable && <ProviderWarning includeTitle={false} />}
    </PopupContent>
  )
}

const HorizontalBorder = () => <div className='h-1 border-b border-gray-200' />
