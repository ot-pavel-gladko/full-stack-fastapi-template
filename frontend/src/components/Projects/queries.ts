import type { SummaryPeriod } from "@/client"
import { ProjectsService, TimeEntriesService } from "@/client"

export function getProjectsQueryOptions() {
  return {
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  }
}

export function getHoursSummaryQueryOptions(period: SummaryPeriod) {
  return {
    queryFn: () => TimeEntriesService.readTimeEntriesSummary({ period }),
    queryKey: ["time-entries-summary", period],
  }
}
