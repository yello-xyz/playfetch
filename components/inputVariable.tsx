import { ReactNode } from 'react'

export const InputVariableClass = 'text-white rounded px-1 py-0.5 bg-purple-400 whitespace-nowrap font-normal'

export default function InputVariable({ children }: { children: ReactNode }) {
  return <span className={InputVariableClass}>{children}</span>
}
