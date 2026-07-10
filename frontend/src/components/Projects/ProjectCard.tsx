import { Link as RouterLink } from "@tanstack/react-router"

import type { ProjectPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatStatusLabel, formatTotalHours } from "./utils"

interface ProjectCardProps {
  project: ProjectPublic
  hoursByProjectId?: Record<string, number>
}

export function ProjectCard({ project, hoursByProjectId = {} }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <CardTitle>{project.name}</CardTitle>
        <Badge variant={project.status === "active" ? "default" : "secondary"}>
          {formatStatusLabel(project.status)}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p
          className={cn(
            "text-sm text-muted-foreground",
            !project.description && "italic",
          )}
        >
          {project.description || "No description"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {project.client || "—"}
          </span>
          <span className="text-xl font-semibold">
            {formatTotalHours(project, hoursByProjectId)}
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <RouterLink to="/time-tracking/log">Log time</RouterLink>
        </Button>
      </CardContent>
    </Card>
  )
}
