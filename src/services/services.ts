import { api } from "@/services/api"
import type { Service } from "@/types"

export function listServices() {
  return api.get<Service[]>("/services")
}

export interface ServiceInput {
  name: string
  description?: string
  durationMinutes: number
  price: number // centavos
}

export function createService(input: ServiceInput) {
  return api.post<Service>("/services", input)
}

export function updateService(id: string, input: Partial<ServiceInput> & { isActive?: boolean }) {
  return api.put<Service>(`/services/${id}`, input)
}

export function deleteService(id: string) {
  return api.delete<void>(`/services/${id}`)
}
