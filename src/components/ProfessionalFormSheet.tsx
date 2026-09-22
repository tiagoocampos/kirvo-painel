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
import { Switch } from "@/components/ui/switch"
import { createProfessional, updateProfessional } from "@/services/professionals"
import { showApiError } from "@/lib/utils-api"
import type { Professional } from "@/types"

const ACCEPTED_TYPES = "image/jpeg,image/jpg,image/png"

const professionalSchema = z.object({
  name: z.string().min(1, "O nome do profissional é obrigatório"),
})

type ProfessionalValues = z.infer<typeof professionalSchema>

interface ProfessionalFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professional: Professional | null
  onSaved: () => void
}

export function ProfessionalFormSheet({ open, onOpenChange, professional, onSaved }: ProfessionalFormSheetProps) {
  const isEdit = Boolean(professional)
  const [submitting, setSubmitting] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [photo, setPhoto] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfessionalValues>({ resolver: zodResolver(professionalSchema) })

  useEffect(() => {
    if (!open) return
    setPhoto(null)
    if (professional) {
      reset({ name: professional.name })
      setIsActive(professional.isActive)
    } else {
      reset({ name: "" })
      setIsActive(true)
    }
  }, [open, professional, reset])

  async function onSubmit(values: ProfessionalValues) {
    try {
      setSubmitting(true)
      if (isEdit && professional) {
        await updateProfessional(professional.id, { name: values.name, isActive, photo })
        toast.success("Profissional atualizado!", { position: "top-center" })
      } else {
        await createProfessional({ name: values.name, photo })
        toast.success("Profissional cadastrado!", { position: "top-center" })
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      showApiError(error, isEdit ? "Erro ao atualizar profissional" : "Erro ao cadastrar profissional")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar profissional" : "Novo profissional"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Atualize os dados do profissional."
              : "Depois de cadastrar, defina o expediente semanal na lista."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: Carlos" {...register("name")} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photo">Foto (opcional)</Label>
            <Input id="photo" type="file" accept={ACCEPTED_TYPES} onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            {isEdit && professional?.photoUrl && !photo && (
              <img
                src={professional.photoUrl}
                alt={professional.name}
                className="mt-1 size-20 rounded-full object-cover"
              />
            )}
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div className="flex flex-col">
                <Label htmlFor="isActive">Profissional ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Profissionais inativos somem da página pública de agendamento.
                </p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar profissional"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
