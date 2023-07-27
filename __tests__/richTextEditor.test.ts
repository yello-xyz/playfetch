import { RichTextFromHTML, RichTextToHTML } from '@/components/richTextInput'

const testHTML = (html: string) =>
  test(`Rich Text Editor Preserves HTML "${html}"`, () => expect(RichTextToHTML(RichTextFromHTML(html))).toBe(html))
const testText = (text: string) =>
  test(`Rich Text Editor Preserves Text "${text}"`, () => expect(RichTextFromHTML(RichTextToHTML(text))).toBe(text))

testText('hello')
testText('hello world ')
testText('hello {world')
testText('hello {world}')
testText('hello {{world}} ')
testText('{{hello world}} ')
testText('{{hello {{world}}}} ')
testText('hello\nworld')
testText('hello\n{{world}} ')
testText('{{hello}}\nworld')

testHTML('hello')
testHTML('hello world')
