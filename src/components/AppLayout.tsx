import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  UserCog,
  Users,
  Palette,
  Menu,
  LogOut,
  Pencil,
  Store,
  Download,
  Share,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BrandMark } from "@/components/BrandMark"
import { StoreSettingsSheet } from "@/components/StoreSettingsSheet"
import { clearAuth, getStoredUser, isStoreOwner } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useTenant } from "@/contexts/TenantContext"
import { useInstallPrompt } from "@/contexts/InstallPromptContext"
import { getPlanLabel } from "@/lib/plan"
import type { Tenant, User } from "@/types"

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
}

const NAV_ITEMS = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true, ownerOnly: false },
  { to: "/agendamentos", label: "Agendamentos", icon: CalendarDays, end: false, ownerOnly: false },
  { to: "/servicos", label: "Serviços", icon: Scissors, end: false, ownerOnly: false },
  { to: "/profissionais", label: "Profissionais", icon: UserCog, end: false, ownerOnly: false },
  { to: "/clientes", label: "Clientes", icon: Users, end: false, ownerOnly: false },
  { to: "/personalizacao", label: "Personalização", icon: Palette, end: false, ownerOnly: true },
]

function NavLinks({ user, onNavigate }: { user: User | null; onNavigate?: () => void }) {
  const owner = isStoreOwner(user)
  const items = NAV_ITEMS.filter((item) => !item.ownerOnly || owner)
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function RoleBadge({ user }: { user: User | null }) {
  if (!user) return null
  return (
    <Badge variant={user.role === "store_owner" ? "default" : "secondary"}>
      {user.role === "store_owner" ? "Dono da barbearia" : "Atendente"}
    </Badge>
  )
}

function PlanBadge({ tenant }: { tenant: Tenant | null }) {
  if (!tenant) return null
  const label = getPlanLabel(tenant)

  if (tenant.effectivePlan === "basico") {
    return (
      <Badge asChild className="w-fit cursor-pointer border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200">
        <Link to="/personalizacao">{label}</Link>
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="w-fit">
      {label}
    </Badge>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { tenant, setTenant } = useTenant()
  const { canInstall, promptInstall } = useInstallPrompt()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [iosInstallOpen, setIosInstallOpen] = useState(false)
  const [alreadyInstalled] = useState(isStandalone)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  function handleLogout() {
    clearAuth()
    navigate("/login", { replace: true })
  }

  const storeUrl = tenant ? `${STOREFRONT_URL}/${tenant.slug}` : null

  function StoreActions() {
    return (
      <div className="flex flex-col gap-2">
        {tenant && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">{tenant.name}</p>
              {isStoreOwner(user) && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Editar nome da barbearia"
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </div>
            <PlanBadge tenant={tenant} />
          </div>
        )}
        {storeUrl ? (
          <Button variant="outline" asChild className="justify-start gap-2">
            <a href={storeUrl} target="_blank" rel="noreferrer">
              <Store className="size-4" />
              Ver minha barbearia
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="justify-start gap-2" disabled>
            <Store className="size-4" />
            Ver minha barbearia
          </Button>
        )}
        {!alreadyInstalled && (canInstall || isIOS) && (
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={canInstall ? promptInstall : () => setIosInstallOpen(true)}
          >
            <Download className="size-4" />
            Instalar app
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 md:flex">
          <div className="flex items-center gap-2 px-1 pt-1">
            <BrandMark />
          </div>
          <NavLinks user={user} />
          <div className="mt-auto flex flex-col gap-3">
            <StoreActions />
            {user && (
              <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <RoleBadge user={user} />
              </div>
            )}
            <Button variant="outline" onClick={handleLogout} className="justify-start gap-2">
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:hidden">
            <BrandMark />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle className="sr-only">KirvoAgenda</SheetTitle>
                  <BrandMark />
                </SheetHeader>
                <div className="flex flex-col gap-6 px-4 pb-4">
                  <NavLinks user={user} onNavigate={() => setMobileOpen(false)} />
                  <StoreActions />
                  {user && (
                    <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
                      <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                      <RoleBadge user={user} />
                    </div>
                  )}
                  <Button variant="outline" onClick={handleLogout} className="justify-start gap-2">
                    <LogOut className="size-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      <StoreSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tenant={tenant}
        onSaved={setTenant}
      />

      <AlertDialog open={iosInstallOpen} onOpenChange={setIosInstallOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instalar o app</AlertDialogTitle>
            <AlertDialogDescription>
              Toque no ícone de compartilhar (<Share className="inline size-3.5 align-text-bottom" />) e
              escolha <strong className="text-foreground">"Adicionar à Tela de Início"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIosInstallOpen(false)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
