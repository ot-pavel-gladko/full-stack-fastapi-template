import type { DaySummary } from "@/client"
import { Card } from "@/components/ui/card"

interface HoursByDayChartProps {
  byDay: DaySummary[]
}

function formatDayLabel(entryDate: string): string {
  const date = new Date(`${entryDate}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export const HoursByDayChart = ({ byDay }: HoursByDayChartProps) => {
  const maxTotal = Math.max(1, ...byDay.map((day) => Number(day.total_hours)))

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="font-semibold">Hours by day</h2>
        <p className="text-muted-foreground text-sm">
          Teal = billable, gray = non-billable
        </p>
      </div>
      {byDay.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No hours logged in this period yet.
        </p>
      ) : (
        <div className="flex items-end gap-3 h-40 pt-2">
          {byDay.map((day) => {
            const total = Number(day.total_hours)
            const billable = Number(day.billable_hours)
            const heightPct = Math.max(4, (total / maxTotal) * 100)
            const billablePct = total > 0 ? (billable / total) * 100 : 0

            return (
              <div
                key={day.entry_date}
                data-testid="hours-by-day-bar"
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-xs font-medium">{total.toFixed(2)}h</span>
                <div
                  className="w-full max-w-9 rounded-t-md bg-secondary flex flex-col justify-end overflow-hidden"
                  style={{ height: `${heightPct}%` }}
                >
                  <div
                    className="w-full bg-primary"
                    style={{ height: `${billablePct}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatDayLabel(day.entry_date)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
