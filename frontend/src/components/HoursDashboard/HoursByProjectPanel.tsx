import type { ProjectHoursSummary } from "@/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HoursByProjectPanelProps {
  hoursByProject: ProjectHoursSummary[]
}

// Rotates through the app's chart-1..chart-5 tokens, mirroring the
// wireframe's per-row bar coloring (mockup used chart-2/chart-1/chart-4).
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function HoursByProjectPanel({ hoursByProject }: HoursByProjectPanelProps) {
  const maxHours = Math.max(1, ...hoursByProject.map((row) => row.total_hours))
  const sorted = [...hoursByProject].sort((a, b) => b.total_hours - a.total_hours)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hours by Project</CardTitle>
        <CardDescription>Billable vs. non-billable split.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hours logged for this period yet.
          </p>
        ) : (
          sorted.map((row, index) => (
            <div key={row.project_id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.project_name}</span>
                <span className="text-muted-foreground">
                  {row.total_hours.toFixed(2)}h
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (row.total_hours / maxHours) * 100)}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))
        )}

        {sorted.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            {/* Bars represent each project's share of total hours (the
              hours-summary endpoint only returns total_hours per project,
              not a billable-only breakdown, so this reads "total" rather
              than the mockup's literal "billable" wording). */}
            Bar length ≈ share of total hours
          </div>
        )}
      </CardContent>
    </Card>
  )
}
