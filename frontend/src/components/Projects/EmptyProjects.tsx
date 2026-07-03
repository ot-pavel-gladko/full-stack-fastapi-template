import { FolderKanban, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EmptyProjectsProps {
  onAdd: () => void
}

export const EmptyProjects = ({ onAdd }: EmptyProjectsProps) => (
  <div className="flex flex-col items-center justify-center text-center py-14">
    <div className="rounded-full bg-muted p-4 mb-4">
      <FolderKanban className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">You don't have any projects yet</h3>
    <p className="text-muted-foreground">
      Create a project to start logging time against it
    </p>
    <Button className="mt-4" onClick={onAdd}>
      <Plus className="mr-2" />
      New Project
    </Button>
  </div>
)
