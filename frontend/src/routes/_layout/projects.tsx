import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { Suspense, useState } from "react"

import { DataTable } from "@/components/Common/DataTable"
import PendingProjects from "@/components/Pending/PendingProjects"
import AddProject from "@/components/Projects/AddProject"
import { columns, type ProjectRow } from "@/components/Projects/columns"
import { EmptyProjects } from "@/components/Projects/EmptyProjects"
import { ProjectCard } from "@/components/Projects/ProjectCard"
import {
  getHoursSummaryQueryOptions,
  getProjectsQueryOptions,
} from "@/components/Projects/queries"
import {
  type ProjectsViewMode,
  ViewSwitch,
} from "@/components/Projects/ViewSwitch"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/projects")({
  component: Projects,
  head: () => ({
    meta: [
      {
        title: "Projects - FastAPI Template",
      },
    ],
  }),
})

function ProjectsBody({
  viewMode,
  onAdd,
}: {
  viewMode: ProjectsViewMode
  onAdd: () => void
}) {
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())
  const { data: summary } = useSuspenseQuery(
    getHoursSummaryQueryOptions("month"),
  )

  const hoursByProject = new Map(
    summary.by_project.map((p) => [p.project_id, Number(p.total_hours)]),
  )
  const rows: ProjectRow[] = projects.data.map((project) => ({
    ...project,
    hoursThisMonth: hoursByProject.get(project.id) ?? 0,
  }))

  if (rows.length === 0) {
    return <EmptyProjects onAdd={onAdd} />
  }

  if (viewMode === "table") {
    return <DataTable columns={columns} data={rows} />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

function Projects() {
  const [viewMode, setViewMode] = useState<ProjectsViewMode>("card")
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage the projects your team logs time against
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitch mode={viewMode} onChange={setViewMode} />
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Suspense fallback={<PendingProjects />}>
        <ProjectsBody viewMode={viewMode} onAdd={() => setIsAddOpen(true)} />
      </Suspense>

      <AddProject open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  )
}
