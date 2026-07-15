import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FolderKanban } from "lucide-react"
import { Suspense, useState } from "react"

import { ProjectsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingProjects from "@/components/Pending/PendingProjects"
import AddProject from "@/components/Projects/AddProject"
import { columns } from "@/components/Projects/columns"
import { ProjectCard } from "@/components/Projects/ProjectCard"
import {
  type ProjectsView,
  ProjectsViewToggle,
} from "@/components/Projects/ProjectsViewToggle"

const VIEW_STORAGE_KEY = "projects-view"

function getStoredView(): ProjectsView {
  if (typeof window === "undefined") return "table"
  const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY)
  return stored === "cards" ? "cards" : "table"
}

function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

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

function ProjectsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FolderKanban className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">
        You don't have any projects yet
      </h3>
      <p className="text-muted-foreground text-sm">
        Create a project to start tracking time against it
      </p>
    </div>
  )
}

function ProjectsContent({ view }: { view: ProjectsView }) {
  const { data: projects } = useSuspenseQuery(getProjectsQueryOptions())

  if (projects.data.length === 0) {
    return <ProjectsEmptyState />
  }

  if (view === "cards") {
    return (
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {projects.data.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    )
  }

  return <DataTable columns={columns} data={projects.data} />
}

function Projects() {
  const [view, setView] = useState<ProjectsView>(() => getStoredView())

  const handleViewChange = (nextView: ProjectsView) => {
    setView(nextView)
    window.sessionStorage.setItem(VIEW_STORAGE_KEY, nextView)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Create projects and see logged hours at a glance
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <ProjectsViewToggle view={view} onChange={handleViewChange} />
          <AddProject />
        </div>
      </div>
      <Suspense fallback={<PendingProjects />}>
        <ProjectsContent view={view} />
      </Suspense>
    </div>
  )
}
