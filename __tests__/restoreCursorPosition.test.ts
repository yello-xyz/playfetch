import { GetCursorPosition, SetCursorPosition } from '@/components/contentEditable'

const testCursorPosition = (testDescription: string, innerHTML: string, position: number, expected = position) =>
  test(`Test restore cursor in ${testDescription} at position ${position}`, () => {
    document.body.innerHTML = innerHTML
    const node = document.body
    SetCursorPosition(node, position)
    expect(GetCursorPosition(node)).toBe(expected)
  })

const testPlainText = (position: number, expected = position) =>
  testCursorPosition('plain text', 'Hello World', position, expected)

testPlainText(0)
testPlainText(5)
testPlainText(11)
testPlainText(12, 0)

const testEmptyEement = (position: number, expected = position) =>
  testCursorPosition('empty element', '<div></div>', position, expected)

testEmptyEement(0)
testEmptyEement(1, 0)

const testNestedEmptyEements = (position: number, expected = position) =>
  testCursorPosition('nested empty elements', '<div><div><div></div></div></div>', position, expected)

testNestedEmptyEements(0)
testNestedEmptyEements(1, 0)

const testEmptyElements = (position: number, expected = position) =>
  testCursorPosition('empty elements', '<div></div><div></div><div></div>', position, expected)

testEmptyElements(0)
testEmptyElements(1)
testEmptyElements(2)
testEmptyElements(3, 0)

const testSingleElement = (position: number, expected = position) =>
  testCursorPosition('single element', '<div>Hello World</div>', position, expected)

testSingleElement(0)
testSingleElement(5)
testSingleElement(11)
testSingleElement(12, 0)

const complexContent = `ABC <b class="text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal">{{DEF}}</b> GHI<div><br /></div><div>IJK</div><div>LMN</div><div><br /></div><div>OPQ <b class="text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal">{{RST}}</b> </div><div>UVW</div><div><br /></div><div>XYZ</div>`

const testComplexContent = (position: number, expected = position) =>
  testCursorPosition('complex content', complexContent, position, expected)

testComplexContent(0)
testComplexContent(1)
testComplexContent(2)
testComplexContent(5)
testComplexContent(10)
testComplexContent(15)
testComplexContent(20)
testComplexContent(25)
testComplexContent(30)
testComplexContent(35)
testComplexContent(40)
testComplexContent(41)
testComplexContent(42)
testComplexContent(43, 0)
