import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { ProjectRow } from "./columns"

interface ProjectCardProps {
  project: ProjectRow
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Card className="gap-3 p-5" data-testid="project-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{project.name}</p>
          <p className="text-muted-foreground text-sm truncate">
            {project.client || "No client"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={project.is_billable_default ? "default" : "outline"}>
          {project.is_billable_default ? "Billable" : "Non-billable"}
        </Badge>
        <Badge variant={project.status === "active" ? "secondary" : "outline"}>
          {project.status === "active" ? "Active" : "Archived"}
        </Badge>
      </div>
      <div className="flex items-baseline justify-between border-t pt-3">
        <span className="text-muted-foreground text-xs">Hours this month</span>
        <span className="text-lg font-bold">
          {project.hoursThisMonth.toFixed(2)} h
        </span>
      </div>
    </Card>
  )
}
