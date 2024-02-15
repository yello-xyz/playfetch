import { Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'

export default function PercentagePieChart({ percentage }: { percentage: number }) {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={[{ value: 1 - percentage }, { name: `${(100 * percentage).toFixed(0)}%`, value: percentage }]}
          activeIndex={1}
          activeShape={renderPieSegment}
          startAngle={90 - percentage * 360}
          endAngle={-270 - percentage * 360}
          cx='50%'
          cy='50%'
          innerRadius={60}
          outerRadius={80}
          dataKey='value'
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export const renderPieSegment = ({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  name,
}: {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  name?: string
}) => (
  <g>
    <defs>
      <linearGradient id='gradient' x1='1' y1='1' x2='0' y2='0'>
        <stop offset='0%' stopColor='#E14BD2' stopOpacity={1} />
        <stop offset='100%' stopColor='#E14BD2' stopOpacity={0.3} />
      </linearGradient>
    </defs>
    <text x={cx} y={cy} dy={8} textAnchor='middle' fill='#333A46' fontSize={30} fontWeight={600}>
      {name}
    </text>
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={0}
      endAngle={360}
      fill='#FDF2FC'
    />
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      cornerRadius={10}
      forceCornerRadius
      cornerIsExternal
      fill='url(#gradient)'
    />
  </g>
)
