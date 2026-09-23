import type { AppointmentStatus } from "@/types"

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
}

export const APPOINTMENT_STATUS_BADGE_CLASSNAME: Record<AppointmentStatus, string> = {
  agendado: "bg-blue-500/10 text-blue-600",
  confirmado: "bg-violet-500/10 text-violet-600",
  concluido: "bg-emerald-500/10 text-emerald-600",
  cancelado: "bg-destructive/10 text-destructive",
  nao_compareceu: "bg-amber-500/10 text-amber-700",
}

const NEXT_STATUS_ACTION: Partial<Record<AppointmentStatus, { label: string; status: AppointmentStatus }>> = {
  agendado: { label: "Marcar como visto", status: "confirmado" },
  confirmado: { label: "Marcar como concluído", status: "concluido" },
}

// Único lugar que conhece a máquina de estados do agendamento do lado da loja —
// agenda, quadro e detalhe usam essas funções em vez de repetir a lógica cada
// um do seu jeito.
export function getNextAppointmentAction(status: AppointmentStatus): { label: string; status: AppointmentStatus } | null {
  return NEXT_STATUS_ACTION[status] ?? null
}

// "Não compareceu" é um desfecho alternativo ao "concluído" — só faz sentido
// enquanto o horário ainda não foi encerrado de nenhuma forma.
export function canMarkNoShow(status: AppointmentStatus): boolean {
  return status === "agendado" || status === "confirmado"
}

export function canCancelAppointment(status: AppointmentStatus): boolean {
  return status === "agendado" || status === "confirmado"
}
