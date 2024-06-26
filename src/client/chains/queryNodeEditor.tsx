import PromptInput from '@/src/client/prompts/promptInput'
import { SingleTabHeader } from '@/src/client/components/tabsHeader'
import queryIcon from '@/public/query.svg'
import { EmbeddingModel, QueryChainItem, QueryProvider } from '@/types'
import TextInput from '@/src/client/components/textInput'
import Label from '@/src/client/components/label'
import DropdownMenu from '@/src/client/components/dropdownMenu'
import {
  EmbeddingModels,
  QueryProviders,
  LabelForProvider,
  ProviderForModel,
  FullLabelForModel,
} from '@/src/common/providerMetadata'
import useAvailableModelProviders, { useCheckProviderAvailable } from '@/src/client/settings/providerContext'
import RangeInput from '@/src/client/components/rangeInput'
import { ProviderWarning } from '@/src/client/prompts/modelUnavailableWarning'

export default function QueryNodeEditor({
  item,
  updateItem,
  variables,
}: {
  item: QueryChainItem
  updateItem: (item: QueryChainItem) => void
  variables: string[]
}) {
  const updateProvider = (provider: QueryProvider) => updateItem({ ...item, provider })
  const updateModel = (model: EmbeddingModel) => updateItem({ ...item, model })
  const updateIndexName = (indexName: string) => updateItem({ ...item, indexName })
  const updateTopK = (topK: number) => updateItem({ ...item, topK })
  const updateQuery = (query: string) => updateItem({ ...item, query })

  const availableProviders = useAvailableModelProviders()
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
              {QueryProviders.map(provider => (
                <option key={provider} value={provider} disabled={!checkProviderAvailable(provider)}>
                  {LabelForProvider(provider)}
                </option>
              ))}
            </DropdownMenu>
            <Label>Embedding Model</Label>
            <DropdownMenu value={item.model} onChange={value => updateModel(value as EmbeddingModel)}>
              {EmbeddingModels.map(model => (
                <option key={model} value={model} disabled={!checkProviderAvailable(ProviderForModel(model))}>
                  {FullLabelForModel(model, availableProviders)}
                </option>
              ))}
            </DropdownMenu>
            <Label>Index Name</Label>
            <TextInput value={item.indexName} setValue={updateIndexName} />
            <Label>Top-K Results</Label>
            <div className='flex items-center gap-4'>
              <RangeInput className='flex-1' value={item.topK} setValue={updateTopK} min={1} max={10} step={1} />
            </div>
          </div>
          <span className='font-medium mt-2.5'>Query</span>
          <PromptInput
            placeholder='Query'
            value={item.query}
            setValue={updateQuery}
            variables={variables}
            preformatted
          />
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
