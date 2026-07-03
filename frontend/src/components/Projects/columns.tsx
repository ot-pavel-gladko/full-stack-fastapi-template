import type { ColumnDef } from "@tanstack/react-table"

import type { ProjectPublic } from "@/client"
import { Badge } from "@/components/ui/badge"

export type ProjectRow = ProjectPublic & { hoursThisMonth: number }

export const columns: ColumnDef<ProjectRow>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.description ? (
          <div className="text-muted-foreground text-xs">
            {row.original.description}
          </div>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) =>
      row.original.client ? (
        row.original.client
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "is_billable_default",
    header: "Default billable",
    cell: ({ row }) => (
      <Badge variant={row.original.is_billable_default ? "default" : "outline"}>
        {row.original.is_billable_default ? "Billable" : "Non-billable"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "active" ? "secondary" : "outline"}
      >
        {row.original.status === "active" ? "Active" : "Archived"}
      </Badge>
    ),
  },
  {
    id: "hoursThisMonth",
    header: "Hours logged (this month)",
    cell: ({ row }) => `${row.original.hoursThisMonth.toFixed(2)} h`,
  },
]
