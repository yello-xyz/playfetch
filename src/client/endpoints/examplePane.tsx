import { useEffect, useState } from 'react'
import { InputValues, ResolvedEndpoint } from '@/types'
import Label from '../components/label'
import { ToCamelCase } from '@/src/common/formatting'
import Icon from '../components/icon'
import clipboardIcon from '@/public/clipboard.svg'
import checkIcon from '@/public/check.svg'
import CodeBlock, { CodeWithMarkup } from '../components/codeBlock'
import { SelectAnyInputRow } from '@/src/client/tables/inputRows'

const buildCurlCommand = (
  endpoint: ResolvedEndpoint,
  variables: string[],
  inputValues: InputValues,
  defaultFlavor: string
) => {
  const apiKey = endpoint.apiKeyDev
  const url = endpoint.url
  const inputRow = SelectAnyInputRow(inputValues, variables)
  const inputs = variables.map(variable => [variable, inputRow[variable]])
  const stringify = (value: any) => JSON.stringify(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")

  return (
    `curl ${endpoint.useStreaming ? '-N ' : ''}-X POST ${url} \\\n  -H "x-api-key: ${apiKey}"` +
    (endpoint.flavor !== defaultFlavor ? ` \\\n  -H "x-environment: ${endpoint.flavor}"` : '') +
    (inputs.length > 0
      ? ` \\\n  -H "content-type: application/json"` +
        ` \\\n  -d $'{ ${inputs
          .map(([variable, value]) => `"${ToCamelCase(variable)}": ${stringify(value ?? '')}`)
          .join(', ')} }'`
      : '')
  )
}

const curlMarkup = [
  ['curl', 'text-[#FF41BE]'],
  ['-', 'text-[#0067F3]'],
  ['POST', 'text-[#0067F3]'],
]

export default function ExamplePane({
  endpoint,
  variables,
  inputValues,
  defaultFlavor,
}: {
  endpoint: ResolvedEndpoint
  variables: string[]
  inputValues: InputValues
  defaultFlavor: string
}) {
  const curlCommand = buildCurlCommand(endpoint, variables, inputValues, defaultFlavor)

  const [copied, setCopied] = useState(false)
  const [canCopyToClipboard, setCanCopyToClipboard] = useState(false)
  useEffect(() => setCanCopyToClipboard(!!navigator.clipboard?.writeText), [])
  const copyToClipboard = (content: string) =>
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }, console.error)

  return (
    <>
      <div className='flex items-center justify-between w-full gap-2 -mb-4 pr-1.5'>
        <Label>Integration</Label>
        {canCopyToClipboard && (
          <div
            className={`flex items-center gap-1 ${copied ? '' : 'cursor-pointer'}`}
            onClick={copied ? undefined : () => copyToClipboard(curlCommand)}>
            {copied ? <Icon icon={checkIcon} /> : <Icon icon={clipboardIcon} />}
            <span>{copied ? 'Copied to clipboard' : 'Copy to clipboard'}</span>
          </div>
        )}
      </div>
      <CodeBlock>
        <CodeWithMarkup markup={curlMarkup}>{curlCommand}</CodeWithMarkup>
      </CodeBlock>
    </>
  )
}
