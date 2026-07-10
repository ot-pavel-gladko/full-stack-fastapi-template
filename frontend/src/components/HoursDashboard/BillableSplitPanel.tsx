import type { HoursSummary } from "@/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Period } from "@/components/TimeEntries/hoursSummaryQuery"

const periodDescription: Record<Period, string> = {
  week: "This week.",
  month: "This month.",
  quarter: "This quarter.",
}

interface BillableSplitPanelProps {
  summary: HoursSummary
  period: Period
}

function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return Math.round((part / total) * 100)
}

export function BillableSplitPanel({ summary, period }: BillableSplitPanelProps) {
  const billablePercent = percent(summary.billable_hours, summary.total_hours)
  const nonBillablePercent = summary.total_hours > 0 ? 100 - billablePercent : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billable vs Non-Billable</CardTitle>
        <CardDescription>{periodDescription[period]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-center py-2">
          <svg width="160" height="160" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.9"
              fill="transparent"
              stroke="var(--muted)"
              strokeWidth="6"
            />
            <circle
              cx="21"
              cy="21"
              r="15.9"
              fill="transparent"
              stroke="var(--chart-2)"
              strokeWidth="6"
              strokeDasharray={`${billablePercent} ${nonBillablePercent}`}
              strokeDashoffset={nonBillablePercent}
              transform="rotate(-90 21 21)"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: "var(--chart-2)" }}
              />
              Billable
            </span>
            <span className="font-bold">
              {summary.billable_hours.toFixed(2)}h ({billablePercent}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: "var(--muted-foreground)" }}
              />
              Non-billable
            </span>
            <span className="font-bold">
              {summary.non_billable_hours.toFixed(2)}h ({nonBillablePercent}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
