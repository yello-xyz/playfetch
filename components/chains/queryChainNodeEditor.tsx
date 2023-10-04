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

export default function QueryChainNodeEditor({
  item,
  updateItem,
}: {
  item: QueryChainItem
  updateItem: (item: QueryChainItem) => void
}) {
  const updateProvider = (provider: QueryProvider) => updateItem({ ...item, provider })
  const updateModel = (model: EmbeddingModel) =>
    updateItem({ ...item, embeddingProvider: ProviderForModel(model), embeddingModel: model })
  const updateIndexName = (indexName: string) => updateItem({ ...item, indexName })
  const updateQuery = (query: string) => updateItem({ ...item, query })

  const checkProviderAvailable = useCheckProviderAvailable()

  const gridConfig = 'grid grid-cols-[160px_minmax(0,1fr)]'

  return (
    <>
      <div className='flex flex-col w-full overflow-y-auto'>
        <SingleTabHeader label='Query' icon={queryIcon} />
        <div className='flex flex-col gap-2 px-4 pt-4 min-h-[350px]'>
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
            <DropdownMenu value={item.embeddingModel} onChange={value => updateModel(value as EmbeddingModel)}>
              {AllEmbeddingModels.map(model => (
                <option key={model} value={model} disabled={!checkProviderAvailable(ProviderForModel(model))}>
                  {`${LabelForProvider(ProviderForModel(model))} - ${model}`}
                </option>
              ))}
            </DropdownMenu>
            <Label>Index name</Label>
            <TextInput value={item.indexName} setValue={updateIndexName} />
          </div>
          <span className='font-medium mt-2.5'>Query</span>
          <PromptInput placeholder='Query' value={item.query} setValue={updateQuery} preformatted />
        </div>
      </div>
    </>
  )
}
