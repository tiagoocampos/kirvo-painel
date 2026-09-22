import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { APPOINTMENT_STATUS_BADGE_CLASSNAME, APPOINTMENT_STATUS_LABELS } from "@/lib/appointmentStatus"
import type { AppointmentStatus } from "@/types"

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("border-transparent", APPOINTMENT_STATUS_BADGE_CLASSNAME[status], className)}>
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
