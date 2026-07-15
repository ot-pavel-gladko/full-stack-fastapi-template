import { useNavigate } from "@tanstack/react-router"

import type { ProjectPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface ProjectCardProps {
  project: ProjectPublic
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm">{project.name}</p>
          <Badge
            variant={project.status === "archived" ? "secondary" : "default"}
          >
            {project.status === "archived" ? "Archived" : "Active"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          {project.client || "—"}
        </p>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-3 py-2 border-t border-b">
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              Hours logged
            </div>
            <div className="text-base font-semibold mt-0.5">0h</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              Billable %
            </div>
            <div className="text-base font-semibold mt-0.5">—</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate({ to: "/log-time" })}
        >
          Log time
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProjectCard
