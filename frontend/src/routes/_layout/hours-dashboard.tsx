import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BarChart2, Clock, Plus } from "lucide-react"
import { Suspense } from "react"

import { DashboardService, TimeEntriesService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/_layout/hours-dashboard")({
  component: HoursDashboardPage,
  head: () => ({
    meta: [{ title: "Hours Dashboard - FastAPI Template" }],
  }),
})

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------
function getDashboardQueryOptions() {
  return {
    queryFn: () => DashboardService.getDashboardSummary(),
    queryKey: ["dashboard-summary"],
  }
}

function getRecentEntriesQueryOptions() {
  return {
    queryFn: () => TimeEntriesService.readTimeEntries({ skip: 0, limit: 10 }),
    queryKey: ["time-entries", { skip: 0, limit: 10 }],
  }
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string
  value: string
  sub: string
  primary?: boolean
}

function StatCard({ label, value, sub, primary }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          {label}
        </div>
        <div
          className={`text-3xl font-bold tracking-tight leading-none ${primary ? "text-primary" : ""}`}
        >
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Dashboard content
// ---------------------------------------------------------------------------
function DashboardContent() {
  const { data: summary, error: summaryError } = useSuspenseQuery(
    getDashboardQueryOptions(),
  )
  const { data: entriesData, error: entriesError } = useSuspenseQuery(
    getRecentEntriesQueryOptions(),
  )

  if (summaryError) {
    return (
      <div className="text-destructive text-sm">
        Failed to load dashboard summary.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hours"
          value={summary.total_hours.toFixed(1)}
          sub="across all projects"
        />
        <StatCard
          label="Billable"
          value={summary.billable_hours.toFixed(1)}
          sub={`${summary.billable_pct.toFixed(1)}% of total`}
          primary
        />
        <StatCard
          label="Non-billable"
          value={summary.non_billable_hours.toFixed(1)}
          sub={`${(100 - summary.billable_pct).toFixed(1)}% of total`}
        />
        <StatCard
          label="Active Projects"
          value={String(summary.active_projects)}
          sub={`${summary.total_projects - summary.active_projects} archived`}
        />
      </div>

      {/* Hours by project */}
      <Card>
        <CardHeader>
          <CardTitle>Hours by Project</CardTitle>
          <CardDescription>
            Billable vs non-billable breakdown per project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.by_project.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <BarChart2 className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No project data yet. Log some time to see stats here.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Billable (h)</TableHead>
                    <TableHead className="text-right">
                      Non-billable (h)
                    </TableHead>
                    <TableHead className="text-right">Total (h)</TableHead>
                    <TableHead>Billable %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.by_project.map((row) => {
                    const isArchived = row.status === "archived"
                    return (
                      <TableRow
                        key={row.project_id}
                        className={isArchived ? "opacity-70" : ""}
                      >
                        <TableCell className="font-medium">
                          {row.project_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isArchived ? "secondary" : "default"}>
                            {isArchived ? "Archived" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.billable_hours.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.non_billable_hours.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {row.total_hours.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[8rem]">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${Math.min(100, row.billable_pct)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {row.billable_pct.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>Last 10 time entries logged</CardDescription>
        </CardHeader>
        <CardContent>
          {entriesError ? (
            <p className="text-destructive text-sm">
              Failed to load recent entries.
            </p>
          ) : entriesData.data.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No time entries yet.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/log-time">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Log Time
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Billable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesData.data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {entry.entry_date ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {parseFloat(entry.hours).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {entry.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.is_billable ? "default" : "secondary"}
                        >
                          {entry.is_billable ? "Billable" : "Non-billable"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function HoursDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hours Dashboard</h1>
          <p className="text-muted-foreground">
            Summary of hours worked across all projects
          </p>
        </div>
        <Button asChild>
          <Link to="/log-time">
            <Plus className="mr-2" />
            Log Time
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm">
            Loading dashboard…
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}
