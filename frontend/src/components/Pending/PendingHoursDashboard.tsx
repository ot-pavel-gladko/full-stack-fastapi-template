import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const PendingHoursDashboard = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="p-5 gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </Card>
      ))}
    </div>
    <Card className="p-6">
      <Skeleton className="h-32 w-full" />
    </Card>
  </div>
)

export default PendingHoursDashboard
