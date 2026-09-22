import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { AppointmentStatusBadge } from "@/components/AppointmentStatusBadge"
import { getCustomerAppointments } from "@/services/customers"
import { formatPrice, showApiError } from "@/lib/utils-api"
import { formatLongDate, getZonedParts } from "@/lib/dates"
import type { Appointment, Customer } from "@/types"

interface CustomerHistorySheetProps {
  customer: Customer | null
  timezone: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerHistorySheet({ customer, timezone, open, onOpenChange }: CustomerHistorySheetProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !customer) return

    let active = true
    setLoading(true)
    getCustomerAppointments(customer.id)
      .then((response) => {
        if (active) setAppointments(response.data)
      })
      .catch((error) => {
        if (!active) return
        showApiError(error, "Erro ao carregar o histórico do cliente")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, customer])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Histórico de {customer?.name}</SheetTitle>
          <SheetDescription>Agendamentos já feitos por este cliente.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
          ) : (
            appointments.map((appointment) => {
              const { date, time } = getZonedParts(appointment.scheduledAt, timezone)
              return (
                <div key={appointment.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground first-letter:uppercase">
                      {formatLongDate(date)} · {time}
                    </span>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {appointment.service.name} com {appointment.professional.name}
                    </span>
                    <span className="font-medium text-foreground">{formatPrice(appointment.price)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
