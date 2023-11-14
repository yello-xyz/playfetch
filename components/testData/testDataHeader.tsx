export default function TestDataHeader({
  variable,
  variables,
  staticVariables,
  grow,
}: {
  variable: string
  variables: string[]
  staticVariables: string[]
  grow?: boolean
}) {
  const bgColor = (variable: string) =>
    staticVariables.includes(variable) ? 'bg-pink-25' : variables.includes(variable) ? 'bg-purple-25' : ''
  const textColor = (variable: string) =>
    staticVariables.includes(variable) ? 'text-pink-400' : variables.includes(variable) ? 'text-purple-400' : ''

  const containerClass = 'flex items-center px-3 py-1 border-b border-l border-gray-200'

  return (
    <div className={`${containerClass} ${grow ? 'grow' : ''}  ${bgColor(variable)}`}>
      <span className={`flex-1 mr-6 font-medium whitespace-nowrap text-ellipsis ${textColor(variable)}`}>
        {staticVariables.includes(variable) ? `{{${variable}}}` : variable}
      </span>
    </div>
  )
}
