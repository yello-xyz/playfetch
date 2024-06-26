import { GlobalPopupLocation } from '@/src/client/components/globalPopupContext'
import { SanitizePopupLocation } from '@/src/client/components/globalPopup'

test(`Test unmounted`, () =>
  expect(SanitizePopupLocation({ left: 100, right: 100 })[0]).toStrictEqual({ left: 100, right: undefined }))

const parentRect = { width: 800, height: 600 }
const childRect = { width: 400, height: 300 }

const testPopupLocation = (testDescription: string, location: GlobalPopupLocation, expected = location) =>
  test(`Test ${testDescription}`, () =>
    expect(SanitizePopupLocation(location, parentRect, childRect)[0]).toStrictEqual(expected))

testPopupLocation('Unspecified', {}, { left: 200, top: 150 })
testPopupLocation('Fully specified', { left: 100, top: 100, right: 100, bottom: 100 })
testPopupLocation(
  'Fully specified with zero top and bottom centered vertically',
  { top: 0, left: 100, right: 100, bottom: 0 },
  { top: 150, left: 100, right: 100, bottom: undefined }
)
testPopupLocation('Top left', { left: 100, top: 100 }, { left: 100, top: 100 })
testPopupLocation('Bottom right', { right: 700, bottom: 500 }, { right: 100, bottom: 100 })
testPopupLocation('Adjusts top left down', { left: 600, top: 400 }, { left: 400, top: 300 })
testPopupLocation('Adjusts bottom right down', { right: 1000, bottom: 800 }, { right: 0, bottom: 0 })
testPopupLocation('Adjusts top left negative up', { left: -200, top: -200 }, { left: 0, top: 0 })
testPopupLocation('Adjusts bottom right negative down', { right: -200, bottom: -200 }, { right: 400, bottom: 300 })
testPopupLocation('Fixed width retains left', { left: 200, right: 600 }, { left: 200, right: 200 })
testPopupLocation('Fixed width adjusts left', { left: 600, right: 1000 }, { left: 400, right: 0 })
testPopupLocation('Fixed height retains top', { top: 200, bottom: 500 }, { top: 200, bottom: 100 })
testPopupLocation('Fixed width adjusts top', { top: 500, bottom: 800 }, { top: 300, bottom: 0 })
