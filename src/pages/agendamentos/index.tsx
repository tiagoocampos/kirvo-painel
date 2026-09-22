import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppLayout } from "@/components/AppLayout"
import { AgendaDayView } from "@/components/AgendaDayView"
import { AppointmentDetailSheet } from "@/components/AppointmentDetailSheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cancelAppointment, listAppointments, updateAppointmentStatus } from "@/services/appointments"
import { listProfessionals } from "@/services/professionals"
import { showApiError, formatPrice } from "@/lib/utils-api"
import { addDays, formatLongDate, todayInTimezone } from "@/lib/dates"
import { useTenant } from "@/contexts/TenantContext"
import type { Appointment, AppointmentStatus, Professional } from "@/types"

const ALL_PROFESSIONALS = "all"

export function AgendamentosPage() {
  const { tenant } = useTenant()
  const timezone = tenant?.timezone ?? "America/Sao_Paulo"

  const [date, setDate] = useState(() => todayInTimezone(timezone))
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [professionalFilter, setProfessionalFilter] = useState(ALL_PROFESSIONALS)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Só reposiciona pro "hoje" do fuso da barbearia quando o tenant carrega —
  // não sobrescreve se o usuário já tiver navegado pra outro dia.
  useEffect(() => {
    if (tenant) setDate((current) => current || todayInTimezone(tenant.timezone))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.timezone])

  useEffect(() => {
    listProfessionals()
      .then((response) => setProfessionals(response.data.filter((professional) => professional.isActive)))
      .catch((error) => showApiError(error, "Erro ao carregar profissionais"))
  }, [])

  async function load() {
    try {
      setLoading(true)
      const response = await listAppointments({
        date,
        professionalId: professionalFilter === ALL_PROFESSIONALS ? undefined : professionalFilter,
      })
      setAppointments(response.data)
    } catch (error) {
      showApiError(error, "Erro ao carregar agendamentos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, professionalFilter])

  const visibleProfessionals =
    professionalFilter === ALL_PROFESSIONALS
      ? professionals
      : professionals.filter((professional) => professional.id === professionalFilter)

  const completedCount = appointments.filter((a) => a.status === "concluido").length
  const canceledCount = appointments.filter((a) => a.status === "cancelado").length
  const revenueToday = appointments
    .filter((a) => a.status === "concluido")
    .reduce((sum, a) => sum + a.price, 0)

  async function handleChangeStatus(appointment: Appointment, status: AppointmentStatus) {
    try {
      setUpdatingId(appointment.id)
      const response = await updateAppointmentStatus(appointment.id, status)
      setAppointments((current) => current.map((a) => (a.id === appointment.id ? response.data : a)))
      setSelected(response.data)
      toast.success("Status do agendamento atualizado!", { position: "top-center" })
    } catch (error) {
      showApiError(error, "Erro ao atualizar o agendamento")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCancel(appointment: Appointment, reason?: string) {
    try {
      setUpdatingId(appointment.id)
      const response = await cancelAppointment(appointment.id, reason)
      setAppointments((current) => current.map((a) => (a.id === appointment.id ? response.data : a)))
      setSelected(response.data)
      toast.success("Agendamento cancelado.", { position: "top-center" })
    } catch (error) {
      showApiError(error, "Erro ao cancelar o agendamento")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Agendamentos</h1>
            <p className="text-sm text-muted-foreground first-letter:uppercase">{formatLongDate(date)}</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Profissional</Label>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PROFESSIONALS}>Todos</SelectItem>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-1.5">
              <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, -1))} aria-label="Dia anterior">
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="agendaDate">Data</Label>
                <Input
                  id="agendaDate"
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, 1))} aria-label="Próximo dia">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Agendamentos no dia</p>
                <p className="text-2xl font-semibold text-foreground">{appointments.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Concluídos / cancelados</p>
                <p className="text-2xl font-semibold text-foreground">
                  {completedCount} / {canceledCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Faturamento do dia</p>
                <p className="text-2xl font-semibold text-foreground">{formatPrice(revenueToday)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-[32rem] w-full" />
        ) : (
          <AgendaDayView
            date={date}
            timezone={timezone}
            professionals={visibleProfessionals}
            appointments={appointments}
            onSelect={(appointment) => {
              setSelected(appointment)
              setDetailOpen(true)
            }}
          />
        )}
      </div>

      <AppointmentDetailSheet
        appointment={selected}
        timezone={timezone}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        updating={updatingId === selected?.id}
        onChangeStatus={(status) => selected && handleChangeStatus(selected, status)}
        onCancel={(reason) => selected && handleCancel(selected, reason)}
      />
    </AppLayout>
  )
}
