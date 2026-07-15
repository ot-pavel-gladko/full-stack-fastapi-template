import { LayoutGrid, Table2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ProjectsView = "table" | "cards"

interface ProjectsViewToggleProps {
  view: ProjectsView
  onChange: (view: ProjectsView) => void
}

export function ProjectsViewToggle({
  view,
  onChange,
}: ProjectsViewToggleProps) {
  return (
    <fieldset
      aria-label="Toggle projects view"
      className="inline-flex items-center gap-0.5 rounded-md border bg-background p-0.5 m-0"
    >
      <Button
        type="button"
        variant={view === "table" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-pressed={view === "table"}
        title="Table view"
        className={cn(view === "table" && "shadow-xs")}
        onClick={() => onChange("table")}
      >
        <Table2 />
        <span className="sr-only">Table view</span>
      </Button>
      <Button
        type="button"
        variant={view === "cards" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-pressed={view === "cards"}
        title="Card view"
        className={cn(view === "cards" && "shadow-xs")}
        onClick={() => onChange("cards")}
      >
        <LayoutGrid />
        <span className="sr-only">Card view</span>
      </Button>
    </fieldset>
  )
}

export default ProjectsViewToggle
