import type { WorkingHourInterval } from "@/types"

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export const DAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

// Espelha (no front) a mesma regra do setWorkingHoursSchema do backend, pra dar
// feedback imediato antes de tentar salvar — o backend continua sendo a fonte
// de verdade (revalida tudo de novo do lado dele).
export function validateWeeklyIntervals(intervals: WorkingHourInterval[]): string | null {
  const byDay = new Map<number, { start: number; end: number }[]>()

  for (const interval of intervals) {
    if (!TIME_REGEX.test(interval.startTime) || !TIME_REGEX.test(interval.endTime)) {
      return "Horário inválido — use o seletor de horário."
    }

    const start = timeToMinutes(interval.startTime)
    const end = timeToMinutes(interval.endTime)

    if (start >= end) {
      return `${DAY_LABELS[interval.dayOfWeek]}: o horário de início deve ser anterior ao de término.`
    }

    const sameDay = byDay.get(interval.dayOfWeek) ?? []
    if (sameDay.some((other) => start < other.end && other.start < end)) {
      return `${DAY_LABELS[interval.dayOfWeek]}: os intervalos não podem se sobrepor.`
    }

    sameDay.push({ start, end })
    byDay.set(interval.dayOfWeek, sameDay)
  }

  return null
}

// Um id local (não persistido) só pra servir de `key` do React nas linhas
// ainda não salvas — descartado ao montar o payload pro backend.
let localIdCounter = 0
export function nextLocalId(): string {
  localIdCounter += 1
  return `local-${localIdCounter}`
}
