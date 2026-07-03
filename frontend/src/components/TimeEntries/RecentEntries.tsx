import { useSuspenseQuery } from "@tanstack/react-query"
import { Pencil } from "lucide-react"

import { getProjectsQueryOptions } from "@/components/Projects/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getTimeEntriesQueryOptions } from "./queries"

const RecentEntries = () => {
  const { data: entries } = useSuspenseQuery(getTimeEntriesQueryOptions())
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())

  const projectNameById = new Map(
    projects.data.map((project) => [project.id, project.name]),
  )

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="font-semibold">Recent entries</h2>
        <p className="text-muted-foreground text-sm">
          Your last logged hours, most recent first.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Billable</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No time entries logged yet.
              </TableCell>
            </TableRow>
          ) : (
            entries.data.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.entry_date}</TableCell>
                <TableCell>
                  {projectNameById.get(entry.project_id) ?? "Unknown project"}
                </TableCell>
                <TableCell>{Number(entry.hours).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.description || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={entry.is_billable ? "default" : "outline"}>
                    {entry.is_billable ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      title="Editing entries is not available yet"
                    >
                      <Pencil />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

export default RecentEntries
