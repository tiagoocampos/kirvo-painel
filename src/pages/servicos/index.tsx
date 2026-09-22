import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Clock } from "lucide-react"
import { AppLayout } from "@/components/AppLayout"
import { ServiceFormSheet } from "@/components/ServiceFormSheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deleteService, listServices } from "@/services/services"
import { showApiError, formatPrice } from "@/lib/utils-api"
import { getStoredUser, isStoreOwner } from "@/lib/auth"
import type { Service } from "@/types"

export function ServicosPage() {
  const owner = isStoreOwner(getStoredUser())
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  async function load() {
    try {
      setLoading(true)
      const response = await listServices()
      setServices(response.data)
    } catch (error) {
      showApiError(error, "Erro ao carregar serviços")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(service: Service) {
    try {
      await deleteService(service.id)
      toast.success("Serviço excluído.", { position: "top-center" })
      load()
    } catch (error) {
      // O backend recusa (400) excluir serviço com agendamentos — a mensagem já
      // sugere desativar em vez de excluir, por isso não precisa de tratamento especial aqui.
      showApiError(error, "Erro ao excluir serviço")
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Serviços</h1>
            <p className="text-sm text-muted-foreground">
              Corte, barba, combos — o que sua barbearia oferece pra agendamento online.
            </p>
          </div>
          {owner && (
            <Button
              onClick={() => {
                setEditingService(null)
                setFormOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="size-4" />
              Novo serviço
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{service.name}</p>
                    {owner && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingService(service)
                            setFormOpen(true)
                          }}
                          aria-label={`Editar ${service.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${service.name}`}>
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          }
                          title="Excluir serviço?"
                          description={`"${service.name}" será removido. Se já houver agendamentos com esse serviço, a exclusão será recusada — desative-o nesse caso.`}
                          confirmText="Excluir"
                          destructive
                          onConfirm={() => handleDelete(service)}
                        />
                      </div>
                    )}
                  </div>

                  {service.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {service.durationMinutes} min
                    </span>
                    <span className="font-semibold text-foreground">{formatPrice(service.price)}</span>
                  </div>

                  {!service.isActive && (
                    <Badge variant="secondary" className="w-fit">
                      Inativo
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {owner && (
        <ServiceFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          service={editingService}
          onSaved={load}
        />
      )}
    </AppLayout>
  )
}
