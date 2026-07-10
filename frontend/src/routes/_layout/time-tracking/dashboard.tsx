import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { BillableSplitPanel } from "@/components/HoursDashboard/BillableSplitPanel"
import { HoursByProjectPanel } from "@/components/HoursDashboard/HoursByProjectPanel"
import { StatCards } from "@/components/HoursDashboard/StatCards"
import PendingHoursDashboard from "@/components/Pending/PendingHoursDashboard"
import {
  type Period,
  getHoursSummaryQueryOptions,
} from "@/components/TimeEntries/hoursSummaryQuery"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const Route = createFileRoute("/_layout/time-tracking/dashboard")({
  component: HoursDashboard,
  head: () => ({
    meta: [
      {
        title: "Hours Dashboard - FastAPI Template",
      },
    ],
  }),
})

function HoursDashboardContent({ period }: { period: Period }) {
  const { data: summary } = useSuspenseQuery(getHoursSummaryQueryOptions(period))

  return (
    <div className="flex flex-col gap-6">
      <StatCards summary={summary} period={period} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <HoursByProjectPanel hoursByProject={summary.hours_by_project} />
        <BillableSplitPanel summary={summary} period={period} />
      </div>
    </div>
  )
}

function HoursDashboard() {
  // Period tabs re-fetch the summary via the period-keyed query cache
  // (week/month/quarter); month is the default per the AC/wireframe.
  const [period, setPeriod] = useState<Period>("month")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hours Dashboard</h1>
          <p className="text-muted-foreground">
            Summary of hours worked across all projects.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Period:</span>
          <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <TabsList>
              <TabsTrigger value="week">This week</TabsTrigger>
              <TabsTrigger value="month">This month</TabsTrigger>
              <TabsTrigger value="quarter">This quarter</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <Suspense fallback={<PendingHoursDashboard />}>
        <HoursDashboardContent period={period} />
      </Suspense>
    </div>
  )
}
