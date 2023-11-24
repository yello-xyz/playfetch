import { GlobalPopupLocation } from '@/src/client/context/globalPopupContext'
import { SanitizePopupLocation } from '@/components/globalPopup'

const parentRect = { width: 800, height: 600 }
const childRect = { width: 400, height: 300 }

const testPopupLocation = (testDescription: string, location: GlobalPopupLocation, expected = location) =>
  test(`Test ${testDescription}`, () =>
    expect(SanitizePopupLocation(location, parentRect, childRect)[0]).toStrictEqual(expected))

testPopupLocation('Unspecified', {}, { left: 200, top: 150 })
testPopupLocation('Fully specified', { left: 100, top: 100, right: 100, bottom: 100 })
testPopupLocation('Top left', { left: 100, top: 100 }, { left: 100, top: 100 })
testPopupLocation('Bottom right', { right: 100, bottom: 100 }, { right: 700, bottom: 500 })
