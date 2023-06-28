export default function Label({
  className,
  htmlFor,
  onClick,
  children,
}: {
  className?: string
  htmlFor?: string
  onClick?: () => void
  children: string
}) {
  return (
    <label
      className={`font-medium text-gray-600 cursor-default ${className ?? ''}`}
      htmlFor={htmlFor}
      onClick={onClick}>
      {children}
    </label>
  )
}
