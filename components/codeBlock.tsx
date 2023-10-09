import { ReactNode } from 'react'

export default function CodeBlock({
  children,
  active,
  scroll,
  error,
}: {
  children: ReactNode
  active?: boolean
  scroll?: boolean
  error?: boolean
}) {
  const baseClass = 'h-full p-2 text-xs rounded-lg bg-white border border-gray-200'
  const scrollClass = scroll ? 'overflow-y-auto' : ''
  const textColorClass = error ? 'text-red-300' : 'text-green-300'
  const focusClass = active ? 'focus-within:border-blue-400' : ''
  return (
    <div className={`${baseClass} ${scrollClass} ${textColorClass} ${focusClass}`}>
      <div className='relative overflow-hidden'>
        <pre className='break-all whitespace-pre-wrap pl-9'>{children}</pre>
        <div className='absolute top-0 left-0'>
          <pre className='w-4 text-right text-gray-400'>
            {[...Array(100).keys()].map(i => (i + 1).toString()).join('\n')}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function CodeWithMarkup({ children, markup }: { children: ReactNode; markup: string[][] }) {
  return (
    <>
      {children
        ?.toString()
        .split('\n')
        .map((line, lineIndex) => (
          <div key={lineIndex}>
            {(line.match(/^\s+|([^\s"]+|"[^"]*")+/g) ?? []).map((span, index, spans) => (
              <span
                key={index}
                className={markup.filter(([text]) => span.startsWith(text)).map(([_, color]) => color)[0] ?? {}}>
                {span}
                {index < spans.length - 1 && !span.endsWith(' ') ? ' ' : ''}
              </span>
            ))}
          </div>
        ))}
    </>
  )
}
