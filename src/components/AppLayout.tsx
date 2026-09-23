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
  Bell,
  BellOff,
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
import { NotificationsSheet } from "@/components/NotificationsSheet"
import { AppointmentDetailSheet } from "@/components/AppointmentDetailSheet"
import { clearAuth, getStoredUser, isStoreOwner } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useTenant } from "@/contexts/TenantContext"
import { useInstallPrompt } from "@/contexts/InstallPromptContext"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount"
import { markAllNotificationsRead } from "@/services/notifications"
import { cancelAppointment, updateAppointmentStatus } from "@/services/appointments"
import { showApiError } from "@/lib/utils-api"
import { getPlanLabel } from "@/lib/plan"
import { isIOS, isStandalone } from "@/lib/pwa"
import type { Appointment, AppointmentStatus, Tenant, User } from "@/types"

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL

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
  const {
    permission: pushPermission,
    subscribed: pushSubscribed,
    loading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [iosInstallOpen, setIosInstallOpen] = useState(false)
  const [alreadyInstalled] = useState(isStandalone)
  const [unreadCount, setUnreadCount] = useUnreadNotificationCount(Boolean(user))
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationAppointment, setNotificationAppointment] = useState<Appointment | null>(null)
  const [notificationDetailOpen, setNotificationDetailOpen] = useState(false)
  const [notificationUpdatingId, setNotificationUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  // Abrir o sheet já limpa o não lido, igual ao comportamento da aba de
  // atividade do Instagram — zera o badge na hora, sem esperar o próximo
  // ciclo do polling.
  function handleNotificationsOpenChange(open: boolean) {
    setNotificationsOpen(open)
    if (open && unreadCount > 0) {
      setUnreadCount(0)
      markAllNotificationsRead().catch(() => {
        // Best-effort: o badge já foi zerado localmente; na pior hipótese o
        // próximo polling devolve a contagem real de novo.
      })
    }
  }

  async function handleNotificationChangeStatus(status: AppointmentStatus) {
    if (!notificationAppointment) return
    try {
      setNotificationUpdatingId(notificationAppointment.id)
      const response = await updateAppointmentStatus(notificationAppointment.id, status)
      setNotificationAppointment(response.data)
    } catch (error) {
      showApiError(error, "Erro ao atualizar o agendamento")
    } finally {
      setNotificationUpdatingId(null)
    }
  }

  async function handleNotificationCancel(reason?: string) {
    if (!notificationAppointment) return
    try {
      setNotificationUpdatingId(notificationAppointment.id)
      const response = await cancelAppointment(notificationAppointment.id, reason)
      setNotificationAppointment(response.data)
    } catch (error) {
      showApiError(error, "Erro ao cancelar o agendamento")
    } finally {
      setNotificationUpdatingId(null)
    }
  }

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
        {pushPermission === "unsupported" ? (
          isIOS &&
          !alreadyInstalled && (
            <Button variant="outline" className="justify-start gap-2" onClick={() => setIosInstallOpen(true)}>
              <Bell className="size-4" />
              Ativar notificações
            </Button>
          )
        ) : pushPermission === "denied" ? (
          <Button variant="outline" className="justify-start gap-2" disabled>
            <BellOff className="size-4" />
            Notificações bloqueadas
          </Button>
        ) : (
          <Button
            variant="outline"
            className="justify-start gap-2"
            disabled={pushLoading}
            onClick={pushSubscribed ? unsubscribePush : subscribePush}
          >
            {pushSubscribed ? <BellOff className="size-4" /> : <Bell className="size-4" />}
            {pushSubscribed ? "Desativar notificações" : "Ativar notificações"}
          </Button>
        )}
      </div>
    )
  }

  function NotificationBell() {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notificações"
        onClick={() => handleNotificationsOpenChange(true)}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 md:flex">
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <BrandMark />
            {user && <NotificationBell />}
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
            <div className="flex items-center gap-1">
              {user && <NotificationBell />}
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
            </div>
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

      <NotificationsSheet
        open={notificationsOpen}
        onOpenChange={handleNotificationsOpenChange}
        onSelectAppointment={(appointment) => {
          setNotificationAppointment(appointment)
          setNotificationDetailOpen(true)
        }}
      />

      <AppointmentDetailSheet
        appointment={notificationAppointment}
        timezone={tenant?.timezone ?? "America/Sao_Paulo"}
        open={notificationDetailOpen}
        onOpenChange={setNotificationDetailOpen}
        updating={notificationUpdatingId === notificationAppointment?.id}
        onChangeStatus={handleNotificationChangeStatus}
        onCancel={handleNotificationCancel}
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
