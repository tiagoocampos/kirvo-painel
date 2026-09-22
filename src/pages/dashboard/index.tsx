import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck, CalendarX, CalendarDays, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/AppLayout"
import { RevenueChart } from "@/components/RevenueChart"
import { getDashboardRevenue, getDashboardSummary } from "@/services/dashboard"
import { showApiError, formatPrice } from "@/lib/utils-api"
import { getStoredUser, isStoreOwner } from "@/lib/auth"
import type { DashboardRevenuePoint, DashboardSummary } from "@/types"

function formatVariance(current: number, previous: number): { label: string; tone: "positive" | "negative" | "neutral" } {
  if (previous === 0) {
    return current === 0 ? { label: "—", tone: "neutral" } : { label: "Novo neste mês", tone: "positive" }
  }
  const change = ((current - previous) / previous) * 100
  const rounded = Math.round(Math.abs(change))
  if (rounded === 0) return { label: "Igual ao mês passado", tone: "neutral" }
  return change > 0
    ? { label: `↑ ${rounded}% em relação ao mês passado`, tone: "positive" }
    : { label: `↓ ${rounded}% em relação ao mês passado`, tone: "negative" }
}

const VARIANCE_CLASSES: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-emerald-600",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

export function DashboardPage() {
  const user = getStoredUser()
  const owner = isStoreOwner(user)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [revenueSeries, setRevenueSeries] = useState<DashboardRevenuePoint[]>([])
  const [loading, setLoading] = useState(owner)

  useEffect(() => {
    if (!owner) return
    let active = true

    async function load() {
      try {
        setLoading(true)
        const [summaryRes, revenueRes] = await Promise.all([
          getDashboardSummary(),
          getDashboardRevenue(30),
        ])
        if (!active) return
        setSummary(summaryRes.data)
        setRevenueSeries(revenueRes.data)
      } catch (error) {
        if (!active) return
        showApiError(error, "Erro ao carregar o painel")
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [owner])

  const hasRevenueInPeriod = revenueSeries.some((point) => point.totalRevenue > 0)
  const revenueVariance = summary
    ? formatVariance(summary.currentMonth.totalRevenue, summary.previousMonth.totalRevenue)
    : null
  const appointmentsVariance = summary
    ? formatVariance(summary.currentMonth.totalAppointments, summary.previousMonth.totalAppointments)
    : null

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Olá{user ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Resumo rápido da sua barbearia.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/agendamentos"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ver agendamentos
          </Link>
          <Link
            to="/servicos"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Gerenciar serviços
          </Link>
        </div>

        {!owner ? (
          <p className="text-sm text-muted-foreground">
            O resumo financeiro e de agendamentos do dia é exclusivo do dono da barbearia. Use "Ver agendamentos"
            para acompanhar a agenda.
          </p>
        ) : (
          <>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              summary && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos hoje</CardTitle>
                      <CalendarDays className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{summary.today.appointmentsToday}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos hoje</CardTitle>
                      <CalendarCheck className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{summary.today.completedToday}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados hoje</CardTitle>
                      <CalendarX className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{summary.today.canceledToday}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento hoje</CardTitle>
                      <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                      {formatPrice(summary.today.revenueToday)}
                    </CardContent>
                  </Card>
                </div>
              )
            )}

            <div className="flex flex-col gap-4 border-t border-border pt-6">
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground">Desempenho mensal</h2>
                <p className="text-sm text-muted-foreground">Comparativo com o mês anterior e faturamento diário.</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : (
                summary && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Faturamento do mês
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-1">
                        <p className="text-2xl font-semibold text-foreground">
                          {formatPrice(summary.currentMonth.totalRevenue)}
                        </p>
                        {revenueVariance && (
                          <p className={`text-xs font-medium ${VARIANCE_CLASSES[revenueVariance.tone]}`}>
                            {revenueVariance.label}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Agendamentos do mês
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-1">
                        <p className="text-2xl font-semibold text-foreground">
                          {summary.currentMonth.totalAppointments}
                        </p>
                        {appointmentsVariance && (
                          <p className={`text-xs font-medium ${VARIANCE_CLASSES[appointmentsVariance.tone]}`}>
                            {appointmentsVariance.label}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Faturamento — últimos 30 dias</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : hasRevenueInPeriod ? (
                    <RevenueChart data={revenueSeries} />
                  ) : (
                    <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                      Nenhum agendamento concluído ainda neste período.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
