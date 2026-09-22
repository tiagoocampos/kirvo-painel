import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Clock3 } from "lucide-react"
import { AppLayout } from "@/components/AppLayout"
import { ProfessionalFormSheet } from "@/components/ProfessionalFormSheet"
import { WorkingHoursEditor } from "@/components/WorkingHoursEditor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deleteProfessional, listProfessionals } from "@/services/professionals"
import { showApiError } from "@/lib/utils-api"
import { getStoredUser, isStoreOwner } from "@/lib/auth"
import { DAY_LABELS } from "@/lib/workingHours"
import type { Professional } from "@/types"

function summarizeWorkingHours(professional: Professional): string {
  const days = new Set((professional.workingHours ?? []).map((interval) => interval.dayOfWeek))
  if (days.size === 0) return "Sem expediente definido"
  const labels = [...days].sort((a, b) => a - b).map((day) => DAY_LABELS[day]!.replace("-feira", ""))
  return labels.join(", ")
}

export function ProfissionaisPage() {
  const owner = isStoreOwner(getStoredUser())
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [hoursOpen, setHoursOpen] = useState(false)
  const [hoursProfessional, setHoursProfessional] = useState<Professional | null>(null)

  async function load() {
    try {
      setLoading(true)
      const response = await listProfessionals()
      setProfessionals(response.data)
    } catch (error) {
      showApiError(error, "Erro ao carregar profissionais")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(professional: Professional) {
    try {
      await deleteProfessional(professional.id)
      toast.success("Profissional excluído.", { position: "top-center" })
      load()
    } catch (error) {
      showApiError(error, "Erro ao excluir profissional")
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Profissionais</h1>
            <p className="text-sm text-muted-foreground">Quem atende na sua barbearia, e em quais horários.</p>
          </div>
          {owner && (
            <Button
              onClick={() => {
                setEditingProfessional(null)
                setFormOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="size-4" />
              Novo profissional
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum profissional cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <Card key={professional.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {professional.photoUrl ? (
                        <img
                          src={professional.photoUrl}
                          alt={professional.name}
                          className="size-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                          {professional.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="flex flex-col">
                        <p className="font-medium text-foreground">{professional.name}</p>
                        {!professional.isActive && (
                          <Badge variant="secondary" className="w-fit">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>

                    {owner && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingProfessional(professional)
                            setFormOpen(true)
                          }}
                          aria-label={`Editar ${professional.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${professional.name}`}>
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          }
                          title="Excluir profissional?"
                          description={`"${professional.name}" será removido. Se já houver agendamentos com ele, a exclusão será recusada — desative-o nesse caso.`}
                          confirmText="Excluir"
                          destructive
                          onConfirm={() => handleDelete(professional)}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHoursProfessional(professional)
                      setHoursOpen(true)
                    }}
                    className="flex items-center gap-1.5 self-start rounded-md text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Clock3 className="size-3.5" />
                    {summarizeWorkingHours(professional)}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {owner && (
        <>
          <ProfessionalFormSheet
            open={formOpen}
            onOpenChange={setFormOpen}
            professional={editingProfessional}
            onSaved={load}
          />
          <WorkingHoursEditor
            open={hoursOpen}
            onOpenChange={setHoursOpen}
            professional={hoursProfessional}
            onSaved={load}
          />
        </>
      )}
    </AppLayout>
  )
}
