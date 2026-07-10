import { createFileRoute } from "@tanstack/react-router"

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
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  )
}
