// A agenda é sempre no fuso da barbearia (Tenant.timezone), não no do
// navegador de quem está logado no painel — o mesmo princípio já usado no
// storefront e no backend. Só a direção "instante UTC -> relógio local" é
// necessária aqui (o painel não cria agendamento, só lê e muda status).

export interface ZonedParts {
  date: string // "YYYY-MM-DD"
  time: string // "HH:mm"
  minutes: number // minutos desde a meia-noite local
}

export function getZonedParts(iso: string, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso))

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  const hour = Number(get("hour"))
  const minute = Number(get("minute"))

  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, minutes: hour * 60 + minute }
}

export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  return getZonedParts(now.toISOString(), timezone).date
}

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

function toUtcNoon(date: string): Date {
  const match = DATE_REGEX.exec(date)
  if (!match) throw new Error(`Data inválida: ${date}`)
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12))
}

export function addDays(date: string, days: number): string {
  const value = toUtcNoon(date)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

// 0 = domingo … 6 = sábado, mesma convenção do WorkingHours.dayOfWeek.
export function weekdayOf(date: string): number {
  return toUtcNoon(date).getUTCDay()
}

// "sexta-feira, 26 de setembro"
export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(
    toUtcNoon(date)
  )
}
