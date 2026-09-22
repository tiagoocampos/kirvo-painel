import { api } from "@/services/api"
import type { Professional, WorkingHourInterval } from "@/types"

export function listProfessionals() {
  return api.get<Professional[]>("/professionals")
}

export function createProfessional(input: { name: string; photo?: File | null }) {
  const formData = new FormData()
  formData.append("name", input.name)
  if (input.photo) formData.append("photo", input.photo)
  return api.post<Professional>("/professionals", formData)
}

export function updateProfessional(
  id: string,
  input: { name?: string; isActive?: boolean; photo?: File | null }
) {
  const formData = new FormData()
  if (input.name !== undefined) formData.append("name", input.name)
  if (input.isActive !== undefined) formData.append("isActive", String(input.isActive))
  if (input.photo) formData.append("photo", input.photo)
  return api.put<Professional>(`/professionals/${id}`, formData)
}

export function deleteProfessional(id: string) {
  return api.delete<void>(`/professionals/${id}`)
}

// Substitui a semana inteira de uma vez — mesmo contrato do backend
// (SetProfessionalWorkingHoursService): apagar tudo e recriar.
export function setProfessionalWorkingHours(id: string, intervals: WorkingHourInterval[]) {
  return api.put<WorkingHourInterval[]>(`/professionals/${id}/working-hours`, {
    intervals: intervals.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
  })
}
