import { CalendarCheck2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarCheck2 className="size-4" strokeWidth={2.25} />
      </span>
      <span className="font-heading text-base font-bold tracking-tight text-foreground">KirvoAgenda</span>
    </div>
  )
}
