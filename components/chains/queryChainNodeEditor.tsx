import PromptInput from '../prompts/promptInput'
import { SingleTabHeader } from '../tabSelector'
import queryIcon from '@/public/query.svg'
import { EmbeddingModel, QueryChainItem, QueryProvider } from '@/types'
import TextInput from '../textInput'
import Label from '../label'
import DropdownMenu from '../dropdownMenu'
import {
  AllEmbeddingModels,
  AllQueryProviders,
  LabelForProvider,
  ProviderForModel,
} from '@/src/common/providerMetadata'
import { useCheckProviderAvailable } from '@/src/client/hooks/useAvailableProviders'
import { ProviderWarning } from '../prompts/promptPanel'

export default function QueryChainNodeEditor({
  item,
  updateItem,
}: {
  item: QueryChainItem
  updateItem: (item: QueryChainItem) => void
}) {
  const updateProvider = (provider: QueryProvider) => updateItem({ ...item, provider })
  const updateModel = (model: EmbeddingModel) => updateItem({ ...item, model })
  const updateIndexName = (indexName: string) => updateItem({ ...item, indexName })
  const updateTopK = (topK: number) => updateItem({ ...item, topK })
  const updateQuery = (query: string) => updateItem({ ...item, query })

  const checkProviderAvailable = useCheckProviderAvailable()
  const isVectorStoreAvailable = checkProviderAvailable(item.provider)
  const isEmbeddingProviderAvailable = checkProviderAvailable(ProviderForModel(item.model))

  const gridConfig = 'grid grid-cols-[160px_minmax(0,1fr)]'

  return (
    <>
      <div className='flex flex-col w-full overflow-y-auto'>
        <SingleTabHeader label='Query' icon={queryIcon} />
        <div className='flex flex-col gap-2 px-4 pt-4 min-h-[400px]'>
          <span className='font-medium'>Configuration</span>
          <div
            className={`${gridConfig} w-full items-center gap-4 p-4 py-4 bg-white border-gray-200 border rounded-lg`}>
            <Label>Vector Store</Label>
            <DropdownMenu value={item.provider} onChange={value => updateProvider(value as QueryProvider)}>
              {AllQueryProviders.map(provider => (
                <option key={provider} value={provider} disabled={!checkProviderAvailable(provider)}>
                  {LabelForProvider(provider)}
                </option>
              ))}
            </DropdownMenu>
            <Label>Embedding Model</Label>
            <DropdownMenu value={item.model} onChange={value => updateModel(value as EmbeddingModel)}>
              {AllEmbeddingModels.map(model => (
                <option key={model} value={model} disabled={!checkProviderAvailable(ProviderForModel(model))}>
                  {`${LabelForProvider(ProviderForModel(model))} - ${model}`}
                </option>
              ))}
            </DropdownMenu>
            <Label>Index Name</Label>
            <TextInput value={item.indexName} setValue={updateIndexName} />
            <Label>Top-K Results</Label>
            <div className='flex items-center gap-4'>
              <input
                className='flex-1 border border-gray-300 accent-gray-700 focus:border focus:border-blue-400 focus:ring-0 focus:outline-none'
                type='range'
                min={1}
                max={10}
                step={1}
                value={item.topK}
                onChange={event => updateTopK(Number(event.target.value))}
              />
              <input
                className='p-2 text-sm border border-gray-300 rounded-lg w-18 focus:border-solid focus:border focus:border-blue-400 focus:ring-0 focus:outline-none'
                type='number'
                min={1}
                max={10}
                step={1}
                value={item.topK}
                onChange={event => updateTopK(Number(event.target.value))}
              />
            </div>
          </div>
          <span className='font-medium mt-2.5'>Query</span>
          <PromptInput placeholder='Query' value={item.query} setValue={updateQuery} preformatted />
        </div>
        {!(isVectorStoreAvailable && isEmbeddingProviderAvailable) && (
          <div className='flex flex-col gap-2 px-4 pt-4'>
            {isVectorStoreAvailable ? (
              <ProviderWarning provider={ProviderForModel(item.model)} />
            ) : (
              <ProviderWarning provider={item.provider} />
            )}
          </div>
        )}
      </div>
    </>
  )
}
