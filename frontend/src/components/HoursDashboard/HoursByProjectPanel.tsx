import type { ProjectHoursSummary } from "@/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HoursByProjectPanelProps {
  hoursByProject: ProjectHoursSummary[]
}

export function HoursByProjectPanel({ hoursByProject }: HoursByProjectPanelProps) {
  const maxHours = Math.max(1, ...hoursByProject.map((row) => row.total_hours))
  const sorted = [...hoursByProject].sort((a, b) => b.total_hours - a.total_hours)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hours by Project</CardTitle>
        <CardDescription>Share of hours logged this period.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hours logged for this period yet.
          </p>
        ) : (
          sorted.map((row) => (
            <div key={row.project_id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.project_name}</span>
                <span className="text-muted-foreground">
                  {row.total_hours.toFixed(2)}h
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.max(4, (row.total_hours / maxHours) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
