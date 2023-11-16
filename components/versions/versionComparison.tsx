import { PromptVersion } from '@/types'
import simplediff from 'simplediff'
import { InputVariableClass } from '../prompts/promptInput'

type Span = { state: ComparisonState; content: string; tagged: boolean }
const trimmedWords = (span: Span) => span.content.trim().split(' ')

const truncateSpan = (span: Span, wordsToCut: number, isFirst: boolean, isLast: boolean) => {
  const words = trimmedWords(span)
  const cutWords = Math.max(0, Math.min(wordsToCut, words.length - (isFirst || isLast ? 2 : 3)))
  if (cutWords > 0) {
    const offset = Math.floor((words.length - cutWords - 3) / 2)
    const prefix = span.content.substring(0, span.content.indexOf(span.content.trim()))
    const firstPart = isFirst ? '' : words.slice(0, words.length - cutWords - (isLast ? 1 : 2 + offset)).join(' ')
    const lastPart = isLast ? '' : words.slice(isFirst ? cutWords + 1 : -1 - offset).join(' ')
    const suffix = span.content.substring(span.content.lastIndexOf(span.content.trim()) + span.content.trim().length)
    span.content = `${prefix}${firstPart} … ${lastPart}${suffix}`
  }
  return wordsToCut - cutWords
}

const truncateStateSpans = (spans: Span[], state: ComparisonState, wordsToCut: number) => {
  for (const [index, span] of spans.slice().reverse().entries()) {
    if (wordsToCut === 0) {
      break
    }
    if (span.state !== state) {
      continue
    }
    wordsToCut = truncateSpan(span, wordsToCut, index === spans.length - 1 && index !== 0, index === 0)
  }
  return wordsToCut
}

const truncate = (spans: Span[], maxLength: number) => {
  const wordCount = (spans: Span | Span[]) =>
    (Array.isArray(spans) ? spans : [spans]).reduce((count, span) => count + trimmedWords(span).length, 0)

  let wordsToCut = wordCount(spans) - maxLength
  if (wordsToCut > 0) {
    wordsToCut = truncateStateSpans(spans, '=', wordsToCut)
  }
  if (wordsToCut > 0) {
    wordsToCut = truncateStateSpans(spans, '-', wordsToCut)
  }
  if (wordsToCut > 0) {
    wordsToCut = truncateStateSpans(spans, '+', wordsToCut)
  }

  return spans
}

type ComparisonState = '=' | '-' | '+'
const classNameForDiff = ({ state, tagged }: { state: ComparisonState; tagged: boolean }, taggedClassName: string) => {
  const baseClassName = 'mr-0.5 whitespace-pre-wrap'
  const classNameIfTagged = tagged ? taggedClassName : ''
  switch (state) {
    case '=':
      return `${baseClassName} ${classNameIfTagged}`
    case '-':
      return `bg-red-100 ${baseClassName} ${classNameIfTagged}`
    case '+':
      return `bg-green-100 ${baseClassName} ${classNameIfTagged}`
  }
}

const tokenize = (prompt: string) => {
  const delimiters = ' .,;:!?-_()[]<>"\'\n\t'
  const tokens = [] as string[]
  let currentCharacters = [] as string[]
  for (const character of prompt) {
    if (delimiters.includes(character)) {
      if (currentCharacters.length) {
        tokens.push(currentCharacters.join(''))
        currentCharacters = []
      }
      tokens.push(character)
    } else {
      currentCharacters.push(character)
    }
  }
  if (currentCharacters.length) {
    tokens.push(currentCharacters.join(''))
  }
  return tokens
}

type State = '=' | '-' | '+'

export const TokenizeContent = (
  currentContent: string,
  compareContent: string | undefined,
  maxLength: number,
  stripSentinels: boolean
) => {
  const parts: [State, string[]][] = compareContent
    ? simplediff.diff(tokenize(compareContent), tokenize(currentContent))
    : [['=', [currentContent]]]

  const result = []
  let tagged = false
  const startSentinel = '{{'
  const endSentinel = '}}'

  for (const part of parts) {
    const state = part[0]
    let content = part[1].join('')
    while (content.length > 0) {
      const start = content.indexOf(startSentinel)
      const end = content.indexOf(endSentinel)
      if (start < 0 && end < 0) {
        result.push({ state, content, tagged })
        break
      } else if (start >= 0 && (end < 0 || start < end) && (!tagged || stripSentinels || start > 0)) {
        result.push({ state, content: content.substring(0, start + (tagged ? startSentinel.length : 0)), tagged })
        content = content.substring(start + (stripSentinels || tagged ? startSentinel.length : 0))
        tagged = true
      } else {
        result.push({
          state,
          content: content.substring(0, end + (tagged && stripSentinels ? 0 : endSentinel.length)),
          tagged,
        })
        content = content.substring(end + endSentinel.length)
        tagged = false
      }
    }
  }

  const filtered = result.filter(({ content }) => content.length > 0)

  return maxLength > 0 ? truncate(filtered, maxLength) : filtered
}

function Comparison({
  currentContent,
  compareContent,
  shouldTruncate,
  stripSentinels,
  taggedClassName,
}: {
  currentContent: string
  compareContent?: string
  shouldTruncate: boolean
  stripSentinels: boolean
  taggedClassName: string
}) {
  return (
    <>
      {TokenizeContent(currentContent, compareContent, shouldTruncate ? 25 : 0, stripSentinels).map(
        (diff, index: number) => (
          <span key={index} className={classNameForDiff(diff, taggedClassName)}>
            {diff.content}
          </span>
        )
      )}
    </>
  )
}

export default function VersionComparison({
  version,
  compareVersion,
  shouldTruncate = true,
  stripSentinels = true,
  taggedClassName = 'font-bold',
}: {
  version: PromptVersion
  compareVersion?: PromptVersion
  shouldTruncate?: boolean
  stripSentinels?: boolean
  taggedClassName?: string
}) {
  return (
    <Comparison
      currentContent={version.prompts.main}
      compareContent={compareVersion?.prompts?.main}
      shouldTruncate={shouldTruncate}
      stripSentinels={stripSentinels}
      taggedClassName={taggedClassName}
    />
  )
}

export function TaggedContent({
  content,
  shouldTruncate = false,
  stripSentinels = false,
  taggedClassName = InputVariableClass,
}: {
  content: string
  shouldTruncate?: boolean
  stripSentinels?: boolean
  taggedClassName?: string
}) {
  return (
    <Comparison
      currentContent={content}
      shouldTruncate={shouldTruncate}
      stripSentinels={stripSentinels}
      taggedClassName={taggedClassName}
    />
  )
}

export function ContentComparison({
  content,
  compareContent,
  shouldTruncate = false,
  stripSentinels = false,
}: {
  content: string
  compareContent?: string
  shouldTruncate?: boolean
  stripSentinels?: boolean
}) {
  return (
    <Comparison
      currentContent={content}
      compareContent={compareContent}
      shouldTruncate={shouldTruncate}
      stripSentinels={stripSentinels}
      taggedClassName=''
    />
  )
}
