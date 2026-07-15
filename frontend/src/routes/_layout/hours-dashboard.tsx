import { createFileRoute } from "@tanstack/react-router"

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

function HoursDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hours Dashboard</h1>
        <p className="text-muted-foreground">
          See logged hours across your projects
        </p>
      </div>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  )
}
