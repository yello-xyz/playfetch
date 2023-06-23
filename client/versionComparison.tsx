import { Version } from '@/types'
import simplediff from 'simplediff'

type ComparisonState = '=' | '-' | '+'
const classNameForDiff = ({ state, tagged }: { state: ComparisonState; tagged: boolean }) => {
  const taggedClassName = tagged ? 'font-bold' : ''
  switch (state) {
    case '=':
      return taggedClassName
    case '-':
      return `bg-red-300 ${taggedClassName}`
    case '+':
      return `bg-green-200 ${taggedClassName}`
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

export default function VersionComparison({
  version,
  previousVersion,
}: {
  version: Version
  previousVersion?: Version
}) {
  const parts = previousVersion
    ? simplediff.diff(tokenize(previousVersion.prompt), tokenize(version.prompt))
    : [['=', [version.prompt]]]

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
      } else if (start >= 0 && (end < 0 || start < end)) {
        result.push({ state, content: content.substring(0, start + (tagged ? startSentinel.length : 0)), tagged })
        content = content.substring(start + startSentinel.length)
        tagged = true
      } else {
        result.push({ state, content: content.substring(0, end + (tagged ? 0 : endSentinel.length)), tagged })
        content = content.substring(end + endSentinel.length)
        tagged = false
      }
    }
  }

  return (
    <>
      {result.map((diff, index: number) => (
        <span key={index} className={classNameForDiff(diff)}>
          {diff.content}
        </span>
      ))}
    </>
  )
}
