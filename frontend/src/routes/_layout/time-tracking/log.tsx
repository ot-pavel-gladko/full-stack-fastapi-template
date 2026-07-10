import { createFileRoute } from "@tanstack/react-router"

import LogTimeForm from "@/components/TimeEntries/LogTimeForm"
import { RecentEntries } from "@/components/TimeEntries/RecentEntries"

export const Route = createFileRoute("/_layout/time-tracking/log")({
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
        <p className="text-muted-foreground">Record hours against a project.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        <LogTimeForm />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Entries</h2>
            <span className="text-sm text-muted-foreground">
              Showing last 5 entries
            </span>
          </div>
          <RecentEntries />
        </div>
      </div>
    </div>
  )
}
