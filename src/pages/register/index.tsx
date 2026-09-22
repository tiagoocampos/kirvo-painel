import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BrandMark } from "@/components/BrandMark"
import { api } from "@/services/api"
import { applyFieldErrors, getApiErrorMessage } from "@/lib/utils-api"

const registerSchema = z
  .object({
    barbershopName: z.string().min(1, "O nome da barbearia é obrigatório"),
    ownerName: z.string().min(1, "Seu nome é obrigatório"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas devem ser iguais",
    path: ["confirmPassword"],
  })

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterValues) {
    try {
      setLoading(true)
      await api.post("/register", {
        barbershopName: values.barbershopName,
        ownerName: values.ownerName,
        email: values.email,
        password: values.password,
      })
      toast.success("Barbearia cadastrada! Faça login para continuar.", { position: "top-center" })
      navigate("/login", { replace: true })
    } catch (error) {
      const applied = applyFieldErrors(
        error,
        { barbershopName: "", ownerName: "", email: "", password: "" },
        (fieldErrors) => {
          Object.entries(fieldErrors).forEach(([field, message]) => {
            if (message) setError(field as keyof RegisterValues, { message })
          })
        }
      )
      if (!applied) {
        toast.error(getApiErrorMessage(error, "Não foi possível cadastrar a barbearia"), { position: "top-center" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-white to-muted px-4 py-10">
      <div className="pointer-events-none absolute -top-32 -right-40 size-105 rounded-full bg-accent/70 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)] ring-1 ring-border sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <p className="text-sm text-muted-foreground">Cadastre sua barbearia e comece a agendar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="barbershopName">Nome da barbearia</Label>
            <Input id="barbershopName" placeholder="Ex: Barbearia do Zé" {...register("barbershopName")} />
            {errors.barbershopName && (
              <span className="text-xs text-destructive">{errors.barbershopName.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerName">Seu nome</Label>
            <Input id="ownerName" placeholder="Nome do responsável" {...register("ownerName")} />
            {errors.ownerName && <span className="text-xs text-destructive">{errors.ownerName.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="voce@barbearia.com" {...register("email")} />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register("password")} />
            {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input id="confirmPassword" type="password" placeholder="Repita a senha" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <span className="text-xs text-destructive">{errors.confirmPassword.message}</span>
            )}
          </div>

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading ? "Cadastrando..." : "Cadastrar barbearia"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma barbearia cadastrada?{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
