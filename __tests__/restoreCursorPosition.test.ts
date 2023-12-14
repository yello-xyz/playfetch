/**
 * @jest-environment jsdom
 */

import { GetCursorPosition, SetCursorPosition } from '@/components/contentEditable'

const testCursorPosition = (testDescription: string, innerHTML: string, position: number, expected: number) =>
  test(`Test restore cursor in ${testDescription} at position ${position}`, () => {
    document.body.innerHTML = innerHTML
    const node = document.body
    SetCursorPosition(node, position)
    expect(GetCursorPosition(node)).toBe(expected)
  })

const testCursorPositions = (testDescription: string, richContent: string, rawContentLength = richContent.length) => {
  for (let position = 0; position <= rawContentLength; ++position) {
    testCursorPosition(testDescription, richContent, position, position)
  }
  testCursorPosition(testDescription, richContent, rawContentLength + 1, 0)
}

testCursorPositions('empty content', '')
testCursorPositions('plain text', 'Hello World')
testCursorPositions('empty element', '<div></div>', 0)
testCursorPositions('nested empty elements', '<div><div><div></div></div></div>', 0)
testCursorPositions('adjacent empty elements', '<div></div><div></div><div></div>', 2)
testCursorPositions('single element', '<div>Hello World</div>', 11)
testCursorPositions(
  'complex content',
  'ABC <b class="text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal">{{DEF}}</b> GHI<div><br /></div><div>IJK</div><div>LMN</div><div><br /></div><div>OPQ <b class="text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal">{{RST}}</b> </div><div>UVW</div><div><br /></div><div>XYZ</div>',
  42
)
