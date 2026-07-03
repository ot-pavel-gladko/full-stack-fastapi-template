import type { ProjectSummary } from "@/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ProjectBreakdownTableProps {
  byProject: ProjectSummary[]
}

export const ProjectBreakdownTable = ({
  byProject,
}: ProjectBreakdownTableProps) => {
  const periodTotal = Math.max(
    1,
    byProject.reduce((sum, project) => sum + Number(project.total_hours), 0),
  )

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Project</TableHead>
            <TableHead>Total hours</TableHead>
            <TableHead>Billable</TableHead>
            <TableHead>% billable</TableHead>
            <TableHead className="w-[220px]">Share of period</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {byProject.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No projects with logged time in this period.
              </TableCell>
            </TableRow>
          ) : (
            byProject.map((project) => {
              const total = Number(project.total_hours)
              const billable = Number(project.billable_hours)
              const share = (total / periodTotal) * 100

              return (
                <TableRow key={project.project_id}>
                  <TableCell className="font-medium">
                    {project.project_name}
                  </TableCell>
                  <TableCell>{total.toFixed(2)} h</TableCell>
                  <TableCell>{billable.toFixed(2)} h</TableCell>
                  <TableCell>{Math.round(project.percent_billable)}%</TableCell>
                  <TableCell>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
