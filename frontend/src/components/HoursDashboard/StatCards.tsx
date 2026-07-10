import type { HoursSummary } from "@/client"
import { Card, CardContent } from "@/components/ui/card"
import type { Period } from "@/components/TimeEntries/hoursSummaryQuery"

const periodLabel: Record<Period, string> = {
  week: "this week",
  month: "this month",
  quarter: "this quarter",
}

function percentOfTotal(part: number, total: number): string {
  if (total <= 0) {
    return "0%"
  }
  return `${Math.round((part / total) * 100)}%`
}

interface StatCardsProps {
  summary: HoursSummary
  period: Period
}

export function StatCards({ summary, period }: StatCardsProps) {
  const projectCount = summary.hours_by_project.length

  const stats = [
    {
      label: "Total Hours",
      value: `${summary.total_hours.toFixed(2)}h`,
      sub: `across ${projectCount} project${projectCount === 1 ? "" : "s"}`,
    },
    {
      label: "Billable Hours",
      value: `${summary.billable_hours.toFixed(2)}h`,
      sub: `${percentOfTotal(summary.billable_hours, summary.total_hours)} of total`,
    },
    {
      label: "Non-Billable Hours",
      value: `${summary.non_billable_hours.toFixed(2)}h`,
      sub: `${percentOfTotal(summary.non_billable_hours, summary.total_hours)} of total`,
    },
    {
      label: "Entries Logged",
      value: `${summary.entries_count}`,
      sub: periodLabel[period],
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </span>
            <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.sub}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
