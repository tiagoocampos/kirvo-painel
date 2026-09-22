import { getZonedParts } from "@/lib/dates"
import { APPOINTMENT_STATUS_BADGE_CLASSNAME, APPOINTMENT_STATUS_LABELS } from "@/lib/appointmentStatus"
import { formatPrice } from "@/lib/utils-api"
import { cn } from "@/lib/utils"
import type { Appointment, Professional } from "@/types"

const PIXELS_PER_MINUTE = 1.3
const MIN_BLOCK_HEIGHT = 32
// Faixa padrão quando ninguém tem expediente cadastrado nesse dia.
const FALLBACK_START_MINUTES = 8 * 60
const FALLBACK_END_MINUTES = 20 * 60

interface AgendaDayViewProps {
  date: string
  timezone: string
  professionals: Professional[]
  appointments: Appointment[]
  onSelect: (appointment: Appointment) => void
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function AgendaDayView({ date, timezone, professionals, appointments, onSelect }: AgendaDayViewProps) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()

  // Faixa do dia: cobre o expediente de todo mundo que atende nesse dia da
  // semana, e se estica pra caber qualquer agendamento fora do expediente
  // cadastrado (ex: expediente mudou depois que o agendamento foi feito).
  let startMinutes = Infinity
  let endMinutes = -Infinity

  for (const professional of professionals) {
    for (const interval of professional.workingHours ?? []) {
      if (interval.dayOfWeek !== weekday) continue
      startMinutes = Math.min(startMinutes, timeToMinutes(interval.startTime))
      endMinutes = Math.max(endMinutes, timeToMinutes(interval.endTime))
    }
  }

  for (const appointment of appointments) {
    const start = getZonedParts(appointment.scheduledAt, timezone).minutes
    const end = getZonedParts(appointment.endsAt, timezone).minutes
    if (Number.isFinite(start)) startMinutes = Math.min(startMinutes, start)
    if (Number.isFinite(end) && end > 0) endMinutes = Math.max(endMinutes, end)
  }

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
    startMinutes = FALLBACK_START_MINUTES
    endMinutes = FALLBACK_END_MINUTES
  }

  // Uma margem de meia hora em cada ponta, arredondada pra hora cheia.
  startMinutes = Math.floor((startMinutes - 15) / 60) * 60
  endMinutes = Math.ceil((endMinutes + 15) / 60) * 60

  const totalMinutes = endMinutes - startMinutes
  const gridHeight = totalMinutes * PIXELS_PER_MINUTE

  const hourMarks: number[] = []
  for (let m = startMinutes; m <= endMinutes; m += 60) hourMarks.push(m)

  const appointmentsByProfessional = new Map<string, Appointment[]>()
  for (const appointment of appointments) {
    const list = appointmentsByProfessional.get(appointment.professional.id) ?? []
    list.push(appointment)
    appointmentsByProfessional.set(appointment.professional.id, list)
  }

  if (professionals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum profissional ativo cadastrado.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `4.5rem repeat(${professionals.length}, minmax(0, 1fr))` }}
      >
        <div className="border-b border-r border-border bg-muted/40" />
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="border-b border-r border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground last:border-r-0"
          >
            {professional.name}
          </div>
        ))}

        <div className="relative border-r border-border" style={{ height: gridHeight }}>
          {hourMarks.map((minute) => (
            <div
              key={minute}
              className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right text-xs text-muted-foreground"
              style={{ top: (minute - startMinutes) * PIXELS_PER_MINUTE }}
            >
              {minutesToLabel(minute)}
            </div>
          ))}
        </div>

        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="relative border-r border-border last:border-r-0"
            style={{ height: gridHeight }}
          >
            {hourMarks.map((minute) => (
              <div
                key={minute}
                className="absolute inset-x-0 border-t border-border/60"
                style={{ top: (minute - startMinutes) * PIXELS_PER_MINUTE }}
              />
            ))}

            {(appointmentsByProfessional.get(professional.id) ?? []).map((appointment) => {
              const start = getZonedParts(appointment.scheduledAt, timezone).minutes
              const end = getZonedParts(appointment.endsAt, timezone).minutes
              const top = (start - startMinutes) * PIXELS_PER_MINUTE
              const height = Math.max((end - start) * PIXELS_PER_MINUTE, MIN_BLOCK_HEIGHT)

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => onSelect(appointment)}
                  className={cn(
                    "absolute inset-x-1 flex flex-col overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm transition-opacity hover:opacity-90",
                    appointment.status === "cancelado" ? "opacity-60" : "",
                    APPOINTMENT_STATUS_BADGE_CLASSNAME[appointment.status]
                  )}
                  style={{ top, height, borderColor: "currentColor" }}
                >
                  <span className="truncate font-semibold">{minutesToLabel(start)} · {appointment.customerName}</span>
                  <span className="truncate">{appointment.service.name}</span>
                  {height >= 56 && (
                    <span className="mt-auto flex items-center justify-between gap-1 text-[11px] opacity-80">
                      <span>{APPOINTMENT_STATUS_LABELS[appointment.status]}</span>
                      <span>{formatPrice(appointment.price)}</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
