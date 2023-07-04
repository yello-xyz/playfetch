import { ReactNode, useEffect, useState } from 'react'
import { PromptInputs, ResolvedEndpoint } from '@/types'
import Button from './button'
import Label from './label'
import { ToCamelCase } from '@/src/common/formatting'

const buildCurlCommand = (
  endpoint: ResolvedEndpoint,
  variables: string[],
  exampleInputs: PromptInputs,
  defaultFlavor: string
) => {
  const apiKey = endpoint.apiKeyDev
  const url = endpoint.url
  const inputs = variables.map(variable => [variable, exampleInputs[variable] ?? ''])

  return (
    `curl -X POST ${url} \\\n  -H "x-api-key: ${apiKey}"` +
    (endpoint.flavor !== defaultFlavor ? ` \\\n  -H "x-environment: ${endpoint.flavor}"` : '') +
    (inputs.length > 0
      ? ` \\\n  -H "content-type: application/json"` +
        ` \\\n  -d '{ ${inputs.map(([variable, value]) => `"${ToCamelCase(variable)}": "${value}"`).join(', ')} }'`
      : '')
  )
}

export default function ExamplePane({
  endpoint,
  variables,
  exampleInputs,
  defaultFlavor,
}: {
  endpoint: ResolvedEndpoint
  variables: string[]
  exampleInputs: PromptInputs
  defaultFlavor: string
}) {
  const curlCommand = buildCurlCommand(endpoint, variables, exampleInputs, defaultFlavor)

  const [canCopyToClipboard, setCanCopyToClipboard] = useState(false)
  useEffect(() => setCanCopyToClipboard(!!navigator.clipboard?.writeText), [])
  const copyToClipboard = (content: string) => navigator.clipboard.writeText(content)

  return (
    <>
      <Label>Endpoint</Label>
      <CodeBlock>
        <MarkedUpCURLCommand>{curlCommand}</MarkedUpCURLCommand>
      </CodeBlock>
      {canCopyToClipboard && (
        <div className='self-end'>
          <Button onClick={() => copyToClipboard(curlCommand)}>Copy</Button>
        </div>
      )}
    </>
  )
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <div className='p-4 text-xs text-green-600 bg-gray-100 rounded-lg'>
      <div className='relative overflow-hidden'>
        {children}
        <div className='absolute top-0 left-0'>
          <pre className='w-4 text-right text-gray-400'>
            {[...Array(100).keys()].map(i => (i + 1).toString()).join('\n')}
          </pre>
        </div>
      </div>
    </div>
  )
}

function MarkedUpCURLCommand({ children }: { children: ReactNode }) {
  return (
    <pre className='pl-10 break-all whitespace-pre-wrap'>
      {children
        ?.toString()
        .split('\n')
        .map((line, index) => (
          <div key={index}>
            <MarkedUpStartLine
              line={line}
              markup={[
                ['curl', 'text-fuchsia-500'],
                ['-X POST', 'text-blue-500'],
              ]}>
              <MarkedUpStartLine line={line} markup={[['  -H', 'text-blue-500']]}>
                <MarkedUpStartLine line={line} markup={[['  -d', 'text-blue-500']]}>
                  {line}
                </MarkedUpStartLine>
              </MarkedUpStartLine>
            </MarkedUpStartLine>
          </div>
        ))}
    </pre>
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
