import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const PendingTimeEntries = () => (
  <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
    <Card className="p-6">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="grid gap-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
    <Card className="p-6">
      <Skeleton className="h-4 w-40 mb-4" />
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full mb-2" />
      ))}
    </Card>
  </div>
)

export default PendingTimeEntries
