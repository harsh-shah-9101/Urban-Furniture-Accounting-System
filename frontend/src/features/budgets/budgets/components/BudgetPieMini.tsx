import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const ACHIEVED_COLOR = '#3b82f6'
const REMAINING_COLOR = '#e5e7eb'

export function BudgetPieMini({ committed, achieved }: { committed: number; achieved: number }) {
  const remaining = Math.max(committed - achieved, 0)
  const data =
    committed <= 0
      ? [{ name: 'No budget', value: 1 }]
      : [
          { name: 'Achieved', value: Math.min(achieved, committed) },
          { name: 'Remaining', value: remaining },
        ]

  return (
    <div className="size-9">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={9} outerRadius={16} stroke="none">
            {committed <= 0 ? (
              <Cell fill={REMAINING_COLOR} />
            ) : (
              <>
                <Cell fill={ACHIEVED_COLOR} />
                <Cell fill={REMAINING_COLOR} />
              </>
            )}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius)',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
