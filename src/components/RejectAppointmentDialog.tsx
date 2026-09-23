import { useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RejectAppointmentDialogProps {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  customerName: string
  onReject: (reason?: string) => void
  submitting?: boolean
}

export function RejectAppointmentDialog({
  trigger,
  open,
  onOpenChange,
  customerName,
  onReject,
  submitting,
}: RejectAppointmentDialogProps) {
  const [reason, setReason] = useState("")

  function handleOpenChange(next: boolean) {
    if (!next) setReason("")
    onOpenChange?.(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recusar agendamento?</AlertDialogTitle>
          <AlertDialogDescription>
            O agendamento de {customerName} será marcado como cancelado. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rejectReason">Motivo (opcional)</Label>
          <Textarea
            id="rejectReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: horário indisponível"
            disabled={submitting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            className={buttonVariants({ variant: "outline" })}
            onClick={() => onReject(undefined)}
          >
            Recusar sem motivo
          </AlertDialogAction>
          <AlertDialogAction
            disabled={submitting}
            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={() => onReject(reason.trim() || undefined)}
          >
            Recusar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
