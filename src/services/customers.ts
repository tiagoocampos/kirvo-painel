import { api } from "@/services/api"
import type { Appointment, Customer } from "@/types"

export function listCustomers() {
  return api.get<Customer[]>("/customers")
}

// Histórico de agendamentos de um cliente específico, pro painel expandir o
// mesmo jeito que o Alô Delivery mostra o histórico de pedidos.
export function getCustomerAppointments(customerId: string) {
  return api.get<Appointment[]>(`/customers/${customerId}/appointments`)
}
