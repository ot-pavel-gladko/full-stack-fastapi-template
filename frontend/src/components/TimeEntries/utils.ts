import type { ProjectPublic } from "@/client"

export function getProjectName(
  projectId: string,
  projects: ProjectPublic[] = [],
): string {
  return projects.find((project) => project.id === projectId)?.name ?? "—"
}

export function formatEntryDate(entryDate: string): string {
  const date = new Date(`${entryDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return entryDate
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
