import { TimeEntriesService } from "@/client"

export function getTimeEntriesQueryOptions() {
  return {
    queryFn: () => TimeEntriesService.readTimeEntries({ skip: 0, limit: 100 }),
    queryKey: ["time-entries"],
  }
}
