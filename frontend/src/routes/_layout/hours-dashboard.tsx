import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import type { SummaryPeriod } from "@/client"
import { HoursByDayChart } from "@/components/Dashboard/HoursByDayChart"
import { MetricCards } from "@/components/Dashboard/MetricCards"
import { PeriodToggle } from "@/components/Dashboard/PeriodToggle"
import { ProjectBreakdownTable } from "@/components/Dashboard/ProjectBreakdownTable"
import PendingHoursDashboard from "@/components/Pending/PendingHoursDashboard"
import { getHoursSummaryQueryOptions } from "@/components/Projects/queries"

export const Route = createFileRoute("/_layout/hours-dashboard")({
  component: HoursDashboard,
  head: () => ({
    meta: [
      {
        title: "Hours Dashboard - FastAPI Template",
      },
    ],
  }),
})

function HoursDashboardBody({ period }: { period: SummaryPeriod }) {
  const { data: summary } = useSuspenseQuery(
    getHoursSummaryQueryOptions(period),
  )

  return (
    <div className="flex flex-col gap-6">
      <MetricCards summary={summary} />
      <HoursByDayChart byDay={summary.by_day} />
      <ProjectBreakdownTable byProject={summary.by_project} />
    </div>
  )
}

function HoursDashboard() {
  const [period, setPeriod] = useState<SummaryPeriod>("week")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hours Dashboard</h1>
          <p className="text-muted-foreground">
            Summary of hours worked across all projects
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <Suspense key={period} fallback={<PendingHoursDashboard />}>
        <HoursDashboardBody period={period} />
      </Suspense>
    </div>
  )
}
