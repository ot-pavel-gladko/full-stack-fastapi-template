import type { ProjectPublic } from "@/client"

/**
 * Total Hours is sourced from the hours-summary endpoint's
 * `hours_by_project` breakdown (TRRND-53), not from the Project entity
 * itself. Until that endpoint is wired in (slice 3), render gracefully.
 */
export function formatTotalHours(
  project: ProjectPublic,
  hoursByProjectId: Record<string, number> = {},
): string {
  const hours = hoursByProjectId[project.id]
  if (hours === undefined) {
    return "—"
  }
  return `${hours.toFixed(2)}h`
}

export function formatStatusLabel(status: string): string {
  return status
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
