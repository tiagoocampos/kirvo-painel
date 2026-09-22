import { api } from "@/services/api"
import type { DashboardRevenuePoint, DashboardSummary } from "@/types"

export function getDashboardSummary() {
  return api.get<DashboardSummary>("/dashboard/summary")
}

export function getDashboardRevenue(days = 30) {
  return api.get<DashboardRevenuePoint[]>("/dashboard/revenue", { params: { days } })
}
