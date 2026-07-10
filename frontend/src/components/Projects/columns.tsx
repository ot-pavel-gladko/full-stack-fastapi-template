import { Link as RouterLink } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"

import type { ProjectPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatStatusLabel, formatTotalHours } from "./utils"

function LogTimeButton() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <RouterLink to="/time-tracking/log">Log time</RouterLink>
    </Button>
  )
}

export function getColumns(
  hoursByProjectId: Record<string, number> = {},
): ColumnDef<ProjectPublic>[] {
  return [
    {
      accessorKey: "name",
      header: "Project",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description
        return (
          <span
            className={cn(
              "max-w-xs truncate block text-muted-foreground",
              !description && "italic",
            )}
          >
            {description || "No description"}
          </span>
        )
      },
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.client || "—"}
        </span>
      ),
    },
    {
      id: "total_hours",
      header: () => <div className="text-right">Total Hours</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatTotalHours(row.original, hoursByProjectId)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {formatStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: () => (
        <div className="flex justify-end">
          <LogTimeButton />
        </div>
      ),
    },
  ]
}
