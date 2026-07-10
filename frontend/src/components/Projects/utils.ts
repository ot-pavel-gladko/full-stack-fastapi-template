import type { ProjectPublic } from "@/client"

/**
 * Total Hours is sourced from the hours-summary endpoint's
 * `hours_by_project` breakdown (TRRND-53), not from the Project entity
 * itself — the current period's (default: this month) logged hours for
 * that project. Renders gracefully ("—") for projects with no entries in
 * the period.
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
