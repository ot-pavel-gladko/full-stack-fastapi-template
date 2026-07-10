import { createFileRoute } from "@tanstack/react-router"

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

function HoursDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hours Dashboard</h1>
        <p className="text-muted-foreground">
          Review team time at a glance.
        </p>
      </div>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  )
}
