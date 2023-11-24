import { InputVariableClass, PromptFromHTML, PromptToHTML } from '@/components/prompts/promptInput'

const testStripsDivs = (html: string) =>
  test(`Rich Text Editor strips Divs "${html}"`, () => expect(PromptFromHTML(html).includes('<div>')).toBe(false))
const testHTML = (html: string, expected = html) =>
  test(`Rich Text Editor Preserves HTML "${html}"`, () => expect(PromptToHTML(PromptFromHTML(html))).toBe(expected))
const testText = (text: string, expected = text) =>
  test(`Rich Text Editor Preserves Text "${text}"`, () => expect(PromptFromHTML(PromptToHTML(text))).toBe(expected))

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

testHTML('<div><br /></div>', '')
testHTML('<br />', '<div><br /></div><div><br /></div>')

testHTML('A<br />B', 'A<div>B<br /></div>')
testHTML('<div>A<br />B</div>', 'A<div>B<br /></div>')
testHTML('<div>A<br /><div>B<br />C</div></div>', 'A<div>B<br /></div><div>C<br /></div>')
testHTML('A\nB', 'A<div>B<br /></div>')
testHTML('<div>[\n  {</div>', '[<div>  {<br /></div>')
testHTML('<div>[\n  {\n</div>', '[<div>  {<br /></div>')

testHTML(`<b class="${InputVariableClass}">{{hello}}</b>world`)
testHTML(`<b class="${InputVariableClass}"><div></b><br /></div>`, '<div><br /></div><div><br /></div>')
