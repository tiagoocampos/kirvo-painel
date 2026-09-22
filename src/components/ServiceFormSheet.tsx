import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createService, updateService } from "@/services/services"
import { showApiError, centsToReais, reaisToCents } from "@/lib/utils-api"
import type { Service } from "@/types"

const serviceSchema = z.object({
  name: z.string().min(1, "O nome do serviço é obrigatório"),
  description: z.string().optional(),
  durationMinutes: z
    .string()
    .regex(/^\d+$/, "Informe só números")
    .refine((v) => Number(v) >= 5 && Number(v) <= 480, "Duração entre 5 e 480 minutos"),
  price: z.string().regex(/^\d+([.,]\d{1,2})?$/, "Preço inválido (ex: 45,00)"),
})

type ServiceValues = z.infer<typeof serviceSchema>

interface ServiceFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSaved: () => void
}

export function ServiceFormSheet({ open, onOpenChange, service, onSaved }: ServiceFormSheetProps) {
  const isEdit = Boolean(service)
  const [submitting, setSubmitting] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceValues>({ resolver: zodResolver(serviceSchema) })

  useEffect(() => {
    if (!open) return
    if (service) {
      reset({
        name: service.name,
        description: service.description ?? "",
        durationMinutes: String(service.durationMinutes),
        price: centsToReais(service.price),
      })
      setIsActive(service.isActive)
    } else {
      reset({ name: "", description: "", durationMinutes: "30", price: "" })
      setIsActive(true)
    }
  }, [open, service, reset])

  async function onSubmit(values: ServiceValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      durationMinutes: Number(values.durationMinutes),
      price: reaisToCents(values.price),
    }

    try {
      setSubmitting(true)
      if (isEdit && service) {
        await updateService(service.id, { ...payload, isActive })
        toast.success("Serviço atualizado!", { position: "top-center" })
      } else {
        await createService(payload)
        toast.success("Serviço criado!", { position: "top-center" })
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      showApiError(error, isEdit ? "Erro ao atualizar serviço" : "Erro ao criar serviço")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar serviço" : "Novo serviço"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Atualize as informações do serviço." : "Preencha os dados do novo serviço."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: Corte de cabelo" {...register("name")} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" placeholder="O que está incluso no serviço" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input id="durationMinutes" inputMode="numeric" placeholder="Ex: 30" {...register("durationMinutes")} />
              {errors.durationMinutes && (
                <span className="text-xs text-destructive">{errors.durationMinutes.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" placeholder="Ex: 45,00" {...register("price")} />
              {errors.price && <span className="text-xs text-destructive">{errors.price.message}</span>}
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div className="flex flex-col">
                <Label htmlFor="isActive">Serviço ativo</Label>
                <p className="text-xs text-muted-foreground">Serviços inativos somem da página pública de agendamento.</p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar serviço"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
