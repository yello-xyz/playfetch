import Image from 'next/image'

export default function Icon(props: any) {
  const { className, icon, ...other } = props
  return (
    <Image
      width={icon.width}
      height={icon.height}
      className={` ${className ?? ''}`}
      src={icon.src}
      alt={icon.src.split('/').slice(-1)[0].split('.')[0]}
      {...other}
    />
  )
}
