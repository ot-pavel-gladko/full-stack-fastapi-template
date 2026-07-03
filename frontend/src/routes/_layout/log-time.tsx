import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import PendingTimeEntries from "@/components/Pending/PendingTimeEntries"
import LogTimeForm from "@/components/TimeEntries/LogTimeForm"
import RecentEntries from "@/components/TimeEntries/RecentEntries"

export const Route = createFileRoute("/_layout/log-time")({
  component: LogTime,
  head: () => ({
    meta: [
      {
        title: "Log Time - FastAPI Template",
      },
    ],
  }),
})

function LogTime() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Time</h1>
        <p className="text-muted-foreground">
          Record hours you've worked against a project
        </p>
      </div>

      <Suspense fallback={<PendingTimeEntries />}>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
          <LogTimeForm />
          <RecentEntries />
        </div>
      </Suspense>
    </div>
  )
}
