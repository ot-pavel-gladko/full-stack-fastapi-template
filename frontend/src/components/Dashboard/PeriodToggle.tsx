import type { SummaryPeriod } from "@/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const periods: { value: SummaryPeriod; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
]

interface PeriodToggleProps {
  value: SummaryPeriod
  onChange: (value: SummaryPeriod) => void
}

export const PeriodToggle = ({ value, onChange }: PeriodToggleProps) => {
  return (
    <div className="inline-flex overflow-hidden rounded-md border">
      {periods.map((period, index) => (
        <Button
          key={period.value}
          type="button"
          variant={value === period.value ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={value === period.value}
          className={cn("rounded-none", index > 0 && "border-l")}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
}
