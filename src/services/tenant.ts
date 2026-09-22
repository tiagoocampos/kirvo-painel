import { api } from "@/services/api"
import type { BusinessHourEntry, Tenant } from "@/types"

export function getMyTenant() {
  return api.get<Tenant>("/tenant/me")
}

export interface UpdateTenantProfileInput {
  name?: string
  logo?: File | null
  banner?: File | null
  favicon?: File | null
  phone?: string
  description?: string
  address?: string
  city?: string
  instagramUrl?: string
  minCancelHoursBefore?: number
  businessHours?: BusinessHourEntry[]
}

export function updateMyTenantProfile(input: UpdateTenantProfileInput) {
  const formData = new FormData()
  if (input.name !== undefined) formData.append("name", input.name)
  if (input.logo) formData.append("logo", input.logo)
  if (input.banner) formData.append("banner", input.banner)
  if (input.favicon) formData.append("favicon", input.favicon)
  if (input.phone !== undefined) formData.append("phone", input.phone)
  if (input.description !== undefined) formData.append("description", input.description)
  if (input.address !== undefined) formData.append("address", input.address)
  if (input.city !== undefined) formData.append("city", input.city)
  if (input.instagramUrl !== undefined) formData.append("instagramUrl", input.instagramUrl)
  if (input.minCancelHoursBefore !== undefined) {
    formData.append("minCancelHoursBefore", String(input.minCancelHoursBefore))
  }
  if (input.businessHours !== undefined) formData.append("businessHours", JSON.stringify(input.businessHours))
  return api.put<Tenant>("/tenant/me", formData)
}
