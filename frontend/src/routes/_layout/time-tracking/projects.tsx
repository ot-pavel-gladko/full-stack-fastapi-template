import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { LayoutGrid, List, Search } from "lucide-react"
import { Suspense, useState } from "react"

import { ProjectsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingProjects from "@/components/Pending/PendingProjects"
import AddProject from "@/components/Projects/AddProject"
import { getColumns } from "@/components/Projects/columns"
import { ProjectCard } from "@/components/Projects/ProjectCard"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

export const Route = createFileRoute("/_layout/time-tracking/projects")({
  component: Projects,
  head: () => ({
    meta: [
      {
        title: "Projects - FastAPI Template",
      },
    ],
  }),
})

type ProjectsView = "table" | "cards"

function ProjectsContent({ view }: { view: ProjectsView }) {
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())

  if (projects.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">You don't have any projects yet</h3>
        <p className="text-muted-foreground">
          Create a new project to start tracking time
        </p>
      </div>
    )
  }

  // Total Hours comes from the hours-summary endpoint's hours_by_project
  // breakdown (TRRND-53). Not wired in until slice 3 lands — pass an empty
  // map so the column/field renders gracefully ("—") in the meantime.
  const hoursByProjectId: Record<string, number> = {}

  if (view === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            hoursByProjectId={hoursByProjectId}
          />
        ))}
      </div>
    )
  }

  return (
    <DataTable columns={getColumns(hoursByProjectId)} data={projects.data} />
  )
}

function ProjectsTable({ view }: { view: ProjectsView }) {
  return (
    <Suspense fallback={<PendingProjects />}>
      <ProjectsContent view={view} />
    </Suspense>
  )
}

function Projects() {
  // Table/cards toggle is client-side only and not persisted (PO-approved).
  const [view, setView] = useState<ProjectsView>("table")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Track projects and review time logged against them
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) {
                setView(value as ProjectsView)
              }
            }}
            variant="outline"
            aria-label="Projects view"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <List />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Card view">
              <LayoutGrid />
            </ToggleGroupItem>
          </ToggleGroup>
          <AddProject />
        </div>
      </div>
      <ProjectsTable view={view} />
    </div>
  )
}
