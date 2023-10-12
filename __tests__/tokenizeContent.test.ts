import { TokenizeContent } from '@/components/versions/versionComparison'

type Token = { state: '=' | '-' | '+'; content: string; tagged: boolean }

const testTokenizeContent = (
  testDescription: string,
  content: string,
  expectedTokens: Token[],
  compareContent?: string,
  maxLength = 0,
  stripSentinels = false
) =>
  test(`Test ${testDescription}`, () => {
    expect(TokenizeContent(content, compareContent, maxLength, stripSentinels)).toStrictEqual(expectedTokens)
  })

const token = (content: string, state: Token['state'] = '=', tagged = false): Token => ({ state, content, tagged })

testTokenizeContent('empty content', '', [])
testTokenizeContent('simple content', 'hello world', [token('hello world')])

testTokenizeContent('truncate', 'hello world how are you', [token('hello … ')], undefined, 1)
testTokenizeContent('truncate limit', 'hello world', [token('hello world')], undefined, 1)

testTokenizeContent('tagged content', 'hello {{world}}', [token('hello '), token('{{world}}', '=', true)])
testTokenizeContent(
  'strip sentinels',
  'hello {{world}}',
  [token('hello '), token('world', '=', true)],
  undefined,
  0,
  true
)

testTokenizeContent('added content', 'hello world', [token('hello'), token(' world', '+')], 'hello')
testTokenizeContent('removed content', 'hello', [token('hello'), token(' world', '-')], 'hello world')
testTokenizeContent(
  'changed content',
  'goodbye world',
  [token('hello', '-'), token('goodbye', '+'), token(' world')],
  'hello world'
)
testTokenizeContent(
  'added sentinels',
  'hello {{world}}',
  [token('hello '), token('world', '-'), token('{{world}}', '+', true)],
  'hello world'
)
testTokenizeContent(
  'removed sentinels',
  'hello world',
  [token('hello '), token('{{world}}', '-', true), token('world', '+')],
  'hello {{world}}'
)
testTokenizeContent(
  'changed sentinels',
  '{{goodbye}} world',
  [token('{{hello}}', '-', true), token('{{goodbye}}', '+', true), token(' world', '=')],
  '{{hello}} world'
)
testTokenizeContent(
  'added stripped sentinels',
  'hello {{world}}',
  [token('hello '), token('world', '-'), token('world', '+', true)],
  'hello world',
  0,
  true
)
testTokenizeContent(
  'removed stripped sentinels',
  'hello world',
  [token('hello '), token('world', '-', true), token('world', '+')],
  'hello {{world}}',
  0,
  true
)
testTokenizeContent(
  'changed stripped sentinels',
  '{{goodbye}} world',
  [token('hello', '-', true), token('goodbye', '+', true), token(' world', '=')],
  '{{hello}} world',
  0,
  true
)
