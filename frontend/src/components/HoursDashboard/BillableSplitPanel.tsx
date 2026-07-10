import type { HoursSummary } from "@/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BillableSplitPanelProps {
  summary: HoursSummary
}

function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return Math.round((part / total) * 100)
}

export function BillableSplitPanel({ summary }: BillableSplitPanelProps) {
  const billablePercent = percent(summary.billable_hours, summary.total_hours)
  const nonBillablePercent = summary.total_hours > 0 ? 100 - billablePercent : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billable vs Non-Billable</CardTitle>
        <CardDescription>This period.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${billablePercent}%` }}
          />
          <div
            className="h-full bg-muted-foreground/40"
            style={{ width: `${nonBillablePercent}%` }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              Billable
            </span>
            <span className="font-medium">
              {summary.billable_hours.toFixed(2)}h ({billablePercent}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              Non-billable
            </span>
            <span className="font-medium">
              {summary.non_billable_hours.toFixed(2)}h ({nonBillablePercent}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
