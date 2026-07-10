import { TimeEntriesService } from "@/client"

export type Period = "week" | "month" | "quarter"

/**
 * Single source of truth for the GET /time-entries/summary query, so the
 * Hours Dashboard (TRRND-56) and the Projects screen's Total Hours column
 * (TRRND-54) stay in sync with the same cache entry per period.
 */
export function getHoursSummaryQueryOptions(period: Period = "month") {
  return {
    queryFn: () => TimeEntriesService.readHoursSummary({ period }),
    queryKey: ["hours-summary", period],
  }
}
