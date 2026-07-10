import { useSuspenseQuery } from "@tanstack/react-query"
import { Suspense } from "react"

import { ProjectsService, TimeEntriesService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import EditTimeEntry from "./EditTimeEntry"
import { formatEntryDate, getProjectName } from "./utils"

function getRecentTimeEntriesQueryOptions() {
  return {
    queryFn: () => TimeEntriesService.readTimeEntries({ skip: 0, limit: 5 }),
    queryKey: ["time-entries", "recent"],
  }
}

function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

function RecentEntriesContent() {
  const { data: timeEntries } = useSuspenseQuery(getRecentTimeEntriesQueryOptions())
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())

  if (timeEntries.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No time entries yet. Log your first entry to see it here.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead>Billable</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timeEntries.data.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatEntryDate(entry.entry_date)}</TableCell>
            <TableCell>{getProjectName(entry.project_id, projects.data)}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">
              {entry.description || "—"}
            </TableCell>
            <TableCell className="text-right">{entry.hours}h</TableCell>
            <TableCell>
              <Badge variant={entry.billable ? "default" : "outline"}>
                {entry.billable ? "Billable" : "Non-billable"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <EditTimeEntry timeEntry={entry} projects={projects.data} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PendingRecentEntries() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead>Billable</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Skeleton className="h-4 w-8" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Skeleton className="h-8 w-14" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function RecentEntries() {
  return (
    <Suspense fallback={<PendingRecentEntries />}>
      <RecentEntriesContent />
    </Suspense>
  )
}
