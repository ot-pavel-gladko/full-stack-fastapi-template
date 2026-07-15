import { useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"

import type { ProjectPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function StatusBadge({ status }: { status?: string }) {
  return (
    <Badge variant={status === "archived" ? "secondary" : "default"}>
      {status === "archived" ? "Archived" : "Active"}
    </Badge>
  )
}

function LogTimeButton() {
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate({ to: "/log-time" })}
    >
      Log time
    </Button>
  )
}

export const columns: ColumnDef<ProjectPublic>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "hoursLogged",
    header: "Hours logged",
    cell: () => <span className="text-muted-foreground">0h</span>,
  },
  {
    id: "billablePercent",
    header: "Billable %",
    cell: () => <span className="text-muted-foreground">—</span>,
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
