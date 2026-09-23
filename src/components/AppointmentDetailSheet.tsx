import { useState } from "react"
import { Phone } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RejectAppointmentDialog } from "@/components/RejectAppointmentDialog"
import { AppointmentStatusBadge } from "@/components/AppointmentStatusBadge"
import { formatPrice } from "@/lib/utils-api"
import { formatLongDate, getZonedParts } from "@/lib/dates"
import { canCancelAppointment, canMarkNoShow, getNextAppointmentAction } from "@/lib/appointmentStatus"
import type { Appointment, AppointmentStatus } from "@/types"

interface AppointmentDetailSheetProps {
  appointment: Appointment | null
  timezone: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChangeStatus: (status: AppointmentStatus) => void
  onCancel: (reason?: string) => void
  updating: boolean
}

export function AppointmentDetailSheet({
  appointment,
  timezone,
  open,
  onOpenChange,
  onChangeStatus,
  onCancel,
  updating,
}: AppointmentDetailSheetProps) {
  const [cancelReason, setCancelReason] = useState("")

  const nextAction = appointment ? getNextAppointmentAction(appointment.status) : null
  const canCancel = Boolean(appointment && canCancelAppointment(appointment.status))
  const canNoShow = Boolean(appointment && canMarkNoShow(appointment.status))

  if (!appointment) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md" />
      </Sheet>
    )
  }

  const { date, time } = getZonedParts(appointment.scheduledAt, timezone)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setCancelReason("")
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agendamento de {appointment.customerName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span className="first-letter:uppercase">
              {formatLongDate(date)} às {time}
            </span>
            <AppointmentStatusBadge status={appointment.status} />
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">Cliente</p>
            <p className="text-sm text-foreground">{appointment.customerName}</p>
            <a
              href={`tel:${appointment.customerPhone}`}
              className="flex w-fit items-center gap-1.5 text-sm text-foreground hover:underline"
            >
              <Phone className="size-3.5" />
              {appointment.customerPhone}
            </a>
          </div>

          <Separator />

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Serviço</span>
              <span className="text-foreground">
                {appointment.service.name} · {appointment.service.durationMinutes} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Profissional</span>
              <span className="text-foreground">{appointment.professional.name}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-semibold">
              <span className="text-foreground">Valor</span>
              <span className="text-foreground">{formatPrice(appointment.price)}</span>
            </div>
          </div>

          {appointment.status === "cancelado" && (
            <div className="flex flex-col gap-1 rounded-md border border-dashed border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
              <span className="font-medium text-destructive">
                Cancelado por {appointment.canceledBy === "customer" ? "cliente" : "barbearia"}
              </span>
              {appointment.cancelReason && (
                <span className="text-muted-foreground">Motivo: {appointment.cancelReason}</span>
              )}
            </div>
          )}

          {canCancel && appointment.status !== "agendado" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cancelReason">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: cliente pediu para remarcar"
                disabled={updating}
              />
            </div>
          )}
        </div>

        {(nextAction || canNoShow || canCancel) && (
          <SheetFooter className="flex-col gap-2">
            {appointment.status === "agendado" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {nextAction && (
                    <Button disabled={updating} onClick={() => onChangeStatus(nextAction.status)}>
                      {nextAction.label}
                    </Button>
                  )}
                  <RejectAppointmentDialog
                    trigger={
                      <Button variant="destructive" disabled={updating}>
                        Recusar
                      </Button>
                    }
                    customerName={appointment.customerName}
                    submitting={updating}
                    onReject={(reason) => onCancel(reason)}
                  />
                </div>
                {canNoShow && (
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" disabled={updating} className="w-full">
                        Marcar não compareceu
                      </Button>
                    }
                    title="Marcar como não compareceu?"
                    description={`O agendamento de ${appointment.customerName} será marcado como "não compareceu".`}
                    confirmText="Marcar"
                    onConfirm={() => onChangeStatus("nao_compareceu")}
                  />
                )}
              </>
            ) : (
              <>
                {nextAction && (
                  <Button disabled={updating} onClick={() => onChangeStatus(nextAction.status)} className="w-full">
                    {nextAction.label}
                  </Button>
                )}
                {canNoShow && (
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" disabled={updating} className="w-full">
                        Marcar não compareceu
                      </Button>
                    }
                    title="Marcar como não compareceu?"
                    description={`O agendamento de ${appointment.customerName} será marcado como "não compareceu".`}
                    confirmText="Marcar"
                    onConfirm={() => onChangeStatus("nao_compareceu")}
                  />
                )}
                {canCancel && (
                  <ConfirmDialog
                    trigger={
                      <Button variant="destructive" disabled={updating} className="w-full">
                        Cancelar agendamento
                      </Button>
                    }
                    title="Cancelar agendamento?"
                    description={`O agendamento de ${appointment.customerName} será marcado como cancelado. Essa ação não pode ser desfeita.`}
                    confirmText="Cancelar agendamento"
                    destructive
                    onConfirm={() => onCancel(cancelReason.trim() || undefined)}
                  />
                )}
              </>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
