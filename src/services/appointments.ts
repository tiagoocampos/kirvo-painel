import { api } from "@/services/api"
import type { Appointment, AppointmentStatus } from "@/types"

export function listAppointments(params: { date?: string; professionalId?: string }) {
  return api.get<Appointment[]>("/appointments", { params })
}

// Usado quando só se tem o appointmentId (ex: item do feed de notificações),
// sem os dados completos do agendamento pra abrir o AppointmentDetailSheet.
export function getAppointment(id: string) {
  return api.get<Appointment>(`/appointments/${id}`)
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  return api.patch<Appointment>(`/appointments/${id}/status`, { status })
}

// Cancelamento do lado da loja: canceledBy "store", motivo opcional (diferente
// do cancelamento do cliente final, onde o motivo é obrigatório).
export function cancelAppointment(id: string, reason?: string) {
  return api.patch<Appointment>(`/appointments/${id}/cancel`, reason ? { reason } : {})
}
