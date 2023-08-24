import { ReactNode, useEffect, useState } from 'react'
import { InputValues, ResolvedEndpoint } from '@/types'
import Label from './label'
import { ToCamelCase } from '@/src/common/formatting'
import Icon from './icon'
import clipboardIcon from '@/public/clipboard.svg'
import { SelectAnyInputRow } from './testButtons'

const buildCurlCommand = (
  endpoint: ResolvedEndpoint,
  variables: string[],
  inputValues: InputValues,
  defaultFlavor: string
) => {
  const apiKey = endpoint.apiKeyDev
  const url = endpoint.url
  const inputRow = SelectAnyInputRow(inputValues, variables)
  const inputs = variables.map(variable => [variable, inputRow[variable] ?? ''])

  return (
    `curl ${endpoint.useStreaming ? '-N ' : ''}-X POST ${url} \\\n  -H "x-api-key: ${apiKey}"` +
    (endpoint.flavor !== defaultFlavor ? ` \\\n  -H "x-environment: ${endpoint.flavor}"` : '') +
    (inputs.length > 0
      ? ` \\\n  -H "content-type: ${endpoint.useStreaming ? 'text/event-stream' : 'application/json'}"` +
        ` \\\n  -d '{ ${inputs.map(([variable, value]) => `"${ToCamelCase(variable)}": "${value}"`).join(', ')} }'`
      : '')
  )
}

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

  const [canCopyToClipboard, setCanCopyToClipboard] = useState(false)
  useEffect(() => setCanCopyToClipboard(!!navigator.clipboard?.writeText), [])
  const copyToClipboard = (content: string) => navigator.clipboard.writeText(content)

  return (
    <>
      <div className='flex items-center justify-between w-full gap-2 -mb-4'>
        <Label>Integration</Label>
        {canCopyToClipboard && (
          <div className='flex items-center gap-1 cursor-pointer' onClick={() => copyToClipboard(curlCommand)}>
            <Icon icon={clipboardIcon} />
            <span>Copy to clipboard</span>
          </div>
        )}
      </div>
      <CodeBlock>
        <MarkedUpCURLCommand useStreaming={endpoint.useStreaming}>{curlCommand}</MarkedUpCURLCommand>
      </CodeBlock>
    </>
  )
}

export function CodeBlock({ children, active, error }: { children: ReactNode; active?: boolean; error?: boolean }) {
  const textColorClass = error ? 'text-red-300' : 'text-green-300'
  const borderClass = active ? 'border' : ''
  return (
    <div className={`p-4 text-xs rounded-lg bg-white border border-gray-200 ${textColorClass} ${borderClass}`}>
      <div className='relative overflow-hidden'>
        <pre className='pl-10 break-all whitespace-pre-wrap'>{children}</pre>
        <div className='absolute top-0 left-0'>
          <pre className='w-4 text-right text-gray-400'>
            {[...Array(100).keys()].map(i => (i + 1).toString()).join('\n')}
          </pre>
        </div>
      </div>
    </div>
  )
}

function MarkedUpCURLCommand({ children, useStreaming }: { children: ReactNode; useStreaming: boolean }) {
  return (
    <>
      {children
        ?.toString()
        .split('\n')
        .map((line, index) => (
          <div key={index}>
            <MarkedUpStartLine
              line={line}
              markup={[
                ['curl', 'text-[#FF41BE]'],
                ...(useStreaming ? [['-N', 'text-[#0067F3]']] : []),
                ['-X POST', 'text-[#0067F3]'],
              ]}>
              <MarkedUpStartLine line={line} markup={[['  -H', 'text-[#0067F3]']]}>
                <MarkedUpStartLine line={line} markup={[['  -d', 'text-[#0067F3]']]}>
                  {line}
                </MarkedUpStartLine>
              </MarkedUpStartLine>
            </MarkedUpStartLine>
          </div>
        ))}
    </>
  )
}

function MarkedUpStartLine({ line, markup, children }: { line: string; markup: string[][]; children: ReactNode }) {
  const sentinel = markup.map(([text]) => text).join(' ')
  return line.startsWith(sentinel) ? (
    <>
      {markup.map(([text, color], index) => (
        <span key={index} className={color}>
          {index > 0 ? ' ' : ''}
          {text}
        </span>
      ))}
      {line.replace(sentinel, '')}
    </>
  ) : (
    <>{children}</>
  )
}
