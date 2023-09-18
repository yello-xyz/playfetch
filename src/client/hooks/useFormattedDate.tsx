import { FormatDate } from '@/src/common/formatting'
import { useEffect, useState } from 'react'

export default function useFormattedDate(timestamp?: number, formatter: (timestamp: number) => string = FormatDate) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    if (timestamp) {
      setFormattedDate(formatter(timestamp))
    }
  }, [timestamp, formatter])
  return formattedDate
}
