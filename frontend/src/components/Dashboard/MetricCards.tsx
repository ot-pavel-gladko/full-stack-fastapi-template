import type { HoursSummary } from "@/client"
import { Card } from "@/components/ui/card"

interface MetricCardsProps {
  summary: HoursSummary
}

export const MetricCards = ({ summary }: MetricCardsProps) => {
  const total = Number(summary.total_hours)
  const billable = Number(summary.billable_hours)
  const nonBillable = Number(summary.non_billable_hours)
  const billablePct = total > 0 ? Math.round((billable / total) * 100) : 0
  const nonBillablePct = total > 0 ? Math.round((nonBillable / total) * 100) : 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-5 gap-1" data-testid="metric-total-hours">
        <p className="text-muted-foreground text-sm">Total hours</p>
        <p className="text-2xl font-bold">{total.toFixed(2)} h</p>
      </Card>
      <Card className="p-5 gap-1" data-testid="metric-billable-hours">
        <p className="text-muted-foreground text-sm">Billable hours</p>
        <p className="text-2xl font-bold">{billable.toFixed(2)} h</p>
        <p className="text-muted-foreground text-xs">{billablePct}% of total</p>
      </Card>
      <Card className="p-5 gap-1" data-testid="metric-non-billable-hours">
        <p className="text-muted-foreground text-sm">Non-billable hours</p>
        <p className="text-2xl font-bold">{nonBillable.toFixed(2)} h</p>
        <p className="text-muted-foreground text-xs">
          {nonBillablePct}% of total
        </p>
      </Card>
      <Card className="p-5 gap-1" data-testid="metric-active-projects">
        <p className="text-muted-foreground text-sm">Active projects</p>
        <p className="text-2xl font-bold">{summary.active_project_count}</p>
        <p className="text-muted-foreground text-xs">
          out of {summary.total_project_count} total
        </p>
      </Card>
    </div>
  )
}
