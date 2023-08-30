import { RichTextFromHTML, RichTextToHTML } from '@/components/richTextInput'

const testStripsDivs = (html: string) =>
  test(`Rich Text Editor strips Divs "${html}"`, () => expect(RichTextFromHTML(html).includes('<div>')).toBe(false))
const testHTML = (html: string) =>
  test(`Rich Text Editor Preserves HTML "${html}"`, () => expect(RichTextToHTML(RichTextFromHTML(html))).toBe(html))
const testText = (text: string) =>
  test(`Rich Text Editor Preserves Text "${text}"`, () => expect(RichTextFromHTML(RichTextToHTML(text))).toBe(text))

testStripsDivs('<div></div>')
testStripsDivs('<div><div></div></div>')
testStripsDivs('<div>A<div>B</div></div>')
testStripsDivs('<div><div>A</div>B</div>')
testStripsDivs('<div>A<div>B</div><div>C</div></div>')

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
testText('&lt;')

testHTML('A')
testHTML('A ')
testHTML('A B')
testHTML('A<div><br /></div>')
testHTML('A<div><br /></div><div><br /></div>')
testHTML('<div><br /></div><div>A<br /></div>')
testHTML('A<div>B<br /></div>')
testHTML('A<div>B<br /></div><div>C<br /></div>')
