import { LanguageModel } from '@/types'
import { PopupContent } from '../popupMenu'
import { FullLabelForModel, IconForProvider, LabelForProvider, ProviderForModel } from './modelSelector'
import Icon from '../icon'
import openInIcon from '@/public/openIn.svg'
import Link from 'next/link'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import { ProviderWarning } from './promptPanel'
import { FormatCost, FormatLargeInteger } from '@/src/common/formatting'

const linkForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return 'https://platform.openai.com/docs/models/gpt-4'
  }
}

const descriptionForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return 'More capable than any GPT-3.5 model, able to do more complex tasks, and optimized for chat.'
  }
}

const maxTokensForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return 8192
  }
}

const inputPriceForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return 0.03
  }
}

const outputPriceForModel = (model: LanguageModel) => {
  switch (model) {
    case 'gpt-3.5-turbo':
    case 'gpt-4':
    case 'claude-instant-1':
    case 'claude-2':
    case 'text-bison@001':
    case 'command':
      return 0.06
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
          <Link className='flex items-center' href={linkForModel(model)} target='_blank'>
            <span className='text-gray-500'>Website</span>
            <Icon icon={openInIcon} />
          </Link>
        </div>
      </div>
      <HorizontalBorder />
      <div className='py-1 text-gray-500'>{descriptionForModel(model)}</div>
      <div className='grid grid-cols-[140px_180px] text-gray-500 gap-y-0.5 pb-1'>
        <span className='font-medium'>Context</span>
        <span>{FormatLargeInteger(maxTokensForModel(model))} tokens</span>
        <HorizontalBorder />
        <HorizontalBorder />
        <span className='font-medium'>Input Pricing</span>
        <span>{FormatCost(inputPriceForModel(model))} / 1K tokens</span>
        <HorizontalBorder />
        <HorizontalBorder />
        <span className='font-medium'>Output Pricing</span>
        <span>{FormatCost(outputPriceForModel(model))} / 1K tokens</span>
      </div>
      {!isProviderAvailable && <ProviderWarning includeTitle={false} />}
    </PopupContent>
  )
}

const HorizontalBorder = () => <div className='h-1 border-b border-gray-200' />
