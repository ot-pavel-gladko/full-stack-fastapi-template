import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const PendingProjects = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="gap-3 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24" />
      </Card>
    ))}
  </div>
)

export default PendingProjects
