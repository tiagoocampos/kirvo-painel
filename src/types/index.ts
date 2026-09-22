export type UserRole = "store_owner" | "store_staff"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
}

export interface BusinessHourEntry {
  dayOfWeek: number // 0 = domingo ... 6 = sábado
  isClosed: boolean
  opensAt: string | null // "HH:mm"
  closesAt: string | null // "HH:mm"
}

export type EffectivePlan = "completo" | "basico"

export interface TenantSubscription {
  status: string // "trial" | "active" | "overdue" | "canceled"
  monthlyPrice: number
  startedAt: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  phone: string | null
  description: string | null
  address: string | null
  city: string | null
  instagramUrl: string | null
  logoUrl: string | null
  bannerUrl: string | null
  faviconUrl: string | null
  timezone: string
  businessHours: BusinessHourEntry[] | null
  // Só exposto por /tenant/me depois do ajuste que fizemos no backend
  // (a rota pública /booking/:slug já expunha isso desde a fase 2).
  minCancelHoursBefore: number
  isActive: boolean
  effectivePlan: EffectivePlan
  subscription: TenantSubscription | null
}

export interface WorkingHourInterval {
  id?: string // presente quando veio do backend; ausente em intervalo ainda não salvo
  dayOfWeek: number
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface Professional {
  id: string
  tenantId: string
  name: string
  photoUrl: string | null
  isActive: boolean
  createdAt: string
  // Só vem preenchido na listagem (GET /professionals) — não vem na resposta
  // de criação/edição do próprio profissional.
  workingHours?: WorkingHourInterval[]
}

export interface Service {
  id: string
  tenantId: string
  name: string
  description: string | null
  durationMinutes: number
  price: number // centavos
  isActive: boolean
  createdAt: string
}

export type AppointmentStatus = "agendado" | "confirmado" | "concluido" | "cancelado" | "nao_compareceu"

export type CanceledBy = "customer" | "store"

// Mesmo shape usado pelo cliente final em GET /booking/:slug/customer/appointments,
// só que GET /appointments é escopado por tenant, não por customerId.
export interface Appointment {
  id: string
  status: AppointmentStatus
  scheduledAt: string // ISO 8601 (instante UTC)
  endsAt: string
  price: number // centavos, travado no momento da marcação
  customerName: string
  customerPhone: string
  cancelReason: string | null
  canceledBy: CanceledBy | null
  createdAt: string
  service: { id: string; name: string; durationMinutes: number }
  professional: { id: string; name: string; photoUrl: string | null }
}

// GET /customers (pendente)
export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  createdAt: string
  appointmentsCount: number
}

// GET /dashboard/summary (pendente)
export interface DashboardTodaySummary {
  appointmentsToday: number
  completedToday: number
  canceledToday: number
  revenueToday: number // centavos, soma de Appointment.price com status "concluido"
}

export interface DashboardMonthSummary {
  totalRevenue: number
  totalAppointments: number
}

export interface DashboardSummary {
  today: DashboardTodaySummary
  currentMonth: DashboardMonthSummary
  previousMonth: DashboardMonthSummary
}

// GET /dashboard/revenue (pendente)
export interface DashboardRevenuePoint {
  date: string // "YYYY-MM-DD"
  totalRevenue: number
  totalAppointments: number
}
