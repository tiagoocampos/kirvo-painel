import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { setProfessionalWorkingHours } from "@/services/professionals"
import { showApiError } from "@/lib/utils-api"
import { DAY_LABELS, nextLocalId, validateWeeklyIntervals } from "@/lib/workingHours"
import type { Professional, WorkingHourInterval } from "@/types"

// Chave estável de linha (id do backend, ou um id local pra intervalo ainda não
// salvo) — o React precisa disso porque a lista é editada em memória antes de salvar.
type Row = WorkingHourInterval & { key: string }

function toRows(intervals: WorkingHourInterval[] | undefined): Row[] {
  return (intervals ?? []).map((interval) => ({ ...interval, key: interval.id ?? nextLocalId() }))
}

interface WorkingHoursEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professional: Professional | null
  onSaved: () => void
}

export function WorkingHoursEditor({ open, onOpenChange, professional, onSaved }: WorkingHoursEditorProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setRows(toRows(professional?.workingHours))
  }, [open, professional])

  function addInterval(dayOfWeek: number) {
    setRows((current) => [...current, { key: nextLocalId(), dayOfWeek, startTime: "09:00", endTime: "18:00" }])
  }

  function removeInterval(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  function updateInterval(key: string, patch: Partial<WorkingHourInterval>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  async function handleSave() {
    if (!professional) return

    const validationError = validateWeeklyIntervals(rows)
    if (validationError) {
      toast.error(validationError, { position: "top-center" })
      return
    }

    try {
      setSubmitting(true)
      await setProfessionalWorkingHours(professional.id, rows)
      toast.success("Expediente atualizado!", { position: "top-center" })
      onSaved()
      onOpenChange(false)
    } catch (error) {
      showApiError(error, "Erro ao salvar o expediente")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Expediente {professional ? `de ${professional.name}` : ""}</SheetTitle>
          <SheetDescription>
            Defina os dias e horários em que este profissional atende. Adicione mais de um intervalo no mesmo dia
            para representar uma pausa (ex: almoço).
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {DAY_LABELS.map((label, dayOfWeek) => {
            const dayRows = rows.filter((row) => row.dayOfWeek === dayOfWeek)

            return (
              <div key={dayOfWeek} className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => addInterval(dayOfWeek)}>
                    <Plus className="size-3.5" />
                    Intervalo
                  </Button>
                </div>

                {dayRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Não atende neste dia.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dayRows.map((row) => (
                      <div key={row.key} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={row.startTime}
                          onChange={(e) => updateInterval(row.key, { startTime: e.target.value })}
                          className="flex h-9 w-28 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                        <span className="text-xs text-muted-foreground">até</span>
                        <input
                          type="time"
                          value={row.endTime}
                          onChange={(e) => updateInterval(row.key, { endTime: e.target.value })}
                          className="flex h-9 w-28 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeInterval(row.key)}
                          aria-label="Remover intervalo"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={submitting || !professional} className="w-full">
            {submitting ? "Salvando..." : "Salvar expediente"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
