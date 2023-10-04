import { LanguageModel } from '@/types'
import { PopupContent } from '../popupMenu'
import {
  DescriptionForModel,
  FullLabelForModel,
  IconForProvider,
  InputPriceForModel,
  LabelForProvider,
  MaxTokensForModel,
  OutputPriceForModel,
  ProviderForModel,
  WebsiteLinkForModel,
} from '@/src/common/providerMetadata'
import Icon from '../icon'
import openInIcon from '@/public/openIn.svg'
import Link from 'next/link'
import { ModelUnavailableWarning } from './promptPanel'
import { FormatCost, FormatLargeInteger } from '@/src/common/formatting'
import { useModelProviders } from '@/src/client/hooks/useAvailableProviders'

export default function ModelInfoPane({ model }: { model: LanguageModel }) {
  const [availableProviders, checkModelAvailable, checkProviderAvailable] = useModelProviders()

  const provider = ProviderForModel(model)
  const isModelAvailable = checkModelAvailable(model)
  return (
    <PopupContent className='p-3 w-[480px] ml-7 flex flex-col gap-1'>
      <div className='flex items-center gap-1'>
        <Icon icon={IconForProvider(provider)} />
        <span>{LabelForProvider(provider)} - </span>
        <span className='font-medium'>{FullLabelForModel(model, availableProviders, false)}</span>
        <div className='flex justify-end flex-1'>
          <Link className='flex items-center' href={WebsiteLinkForModel(model)} target='_blank'>
            <span className='text-gray-500'>Website</span>
            <Icon icon={openInIcon} />
          </Link>
        </div>
      </div>
      <HorizontalBorder />
      <div className='py-1 text-gray-500'>{DescriptionForModel(model, availableProviders)}</div>
      <div className='grid grid-cols-[140px_180px] text-gray-500 gap-y-0.5 pb-1'>
        <span className='font-medium'>Context</span>
        <span>{FormatLargeInteger(MaxTokensForModel(model))} tokens</span>
        {(InputPriceForModel(model) > 0 || OutputPriceForModel(model) > 0) && (
          <>
            <HorizontalBorder />
            <HorizontalBorder />
            <span className='font-medium'>Input Pricing</span>
            <span>{FormatCost(InputPriceForModel(model))} / 1M tokens</span>
            <HorizontalBorder />
            <HorizontalBorder />
            <span className='font-medium'>Output Pricing</span>
            <span>{FormatCost(OutputPriceForModel(model))} / 1M tokens</span>
          </>
        )}
      </div>
      {!isModelAvailable && (
        <ModelUnavailableWarning model={model} includeTitle={false} checkProviderAvailable={checkProviderAvailable} />
      )}
    </PopupContent>
  )
}

const HorizontalBorder = () => <div className='h-1 border-b border-gray-200' />
