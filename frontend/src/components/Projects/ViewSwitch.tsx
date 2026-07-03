import { LayoutGrid, Table2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ProjectsViewMode = "card" | "table"

interface ViewSwitchProps {
  mode: ProjectsViewMode
  onChange: (mode: ProjectsViewMode) => void
}

export const ViewSwitch = ({ mode, onChange }: ViewSwitchProps) => {
  return (
    <div className="inline-flex overflow-hidden rounded-md border">
      <Button
        type="button"
        variant={mode === "card" ? "secondary" : "ghost"}
        size="icon"
        aria-label="Card view"
        aria-pressed={mode === "card"}
        className={cn("rounded-none")}
        onClick={() => onChange("card")}
      >
        <LayoutGrid />
      </Button>
      <Button
        type="button"
        variant={mode === "table" ? "secondary" : "ghost"}
        size="icon"
        aria-label="Table view"
        aria-pressed={mode === "table"}
        className={cn("rounded-none border-l")}
        onClick={() => onChange("table")}
      >
        <Table2 />
      </Button>
    </div>
  )
}
