import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { listNotifications } from "@/services/notifications"
import { getAppointment } from "@/services/appointments"
import { showApiError } from "@/lib/utils-api"
import { formatRelativeTime } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { AppNotification, Appointment } from "@/types"

interface NotificationsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAppointment: (appointment: Appointment) => void
}

const PAGE_LIMIT = 20

export function NotificationsSheet({ open, onOpenChange, onSelectAppointment }: NotificationsSheetProps) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    let active = true
    setLoading(true)
    listNotifications({ limit: PAGE_LIMIT })
      .then((response) => {
        if (!active) return
        setItems(response.data.items)
        setCursor(response.data.nextCursor)
      })
      .catch((error) => showApiError(error, "Erro ao carregar notificações"))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open])

  async function loadMore() {
    if (!cursor || loadingMore) return
    try {
      setLoadingMore(true)
      const response = await listNotifications({ cursor, limit: PAGE_LIMIT })
      setItems((current) => [...current, ...response.data.items])
      setCursor(response.data.nextCursor)
    } catch (error) {
      showApiError(error, "Erro ao carregar mais notificações")
    } finally {
      setLoadingMore(false)
    }
  }

  // Scroll infinito: observa uma sentinela no fim da lista e carrega a
  // próxima página assim que ela entra na viewport, em vez de paginação
  // numerada — combina melhor com o formato de feed.
  useEffect(() => {
    if (!open || !cursor) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cursor, items.length])

  async function handleItemClick(notification: AppNotification) {
    if (!notification.appointmentId) return
    try {
      setOpeningId(notification.id)
      const response = await getAppointment(notification.appointmentId)
      onSelectAppointment(response.data)
      onOpenChange(false)
    } catch (error) {
      showApiError(error, "Erro ao abrir o agendamento")
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
          <SheetDescription>Atividade recente da sua barbearia.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-1 px-2 pb-4">
          {loading ? (
            <div className="flex flex-col gap-2 px-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
          ) : (
            <>
              {items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  disabled={!notification.appointmentId || openingId === notification.id}
                  onClick={() => handleItemClick(notification)}
                  className="flex items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors enabled:hover:bg-muted disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}
                  >
                    <CalendarDays className="size-4" />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm text-foreground",
                        !notification.read && "font-semibold"
                      )}
                    >
                      {notification.body}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
                  </span>
                  {!notification.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}

              <div ref={sentinelRef} className="h-1" />

              {loadingMore && <Skeleton className="h-16 w-full" />}
            </>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" asChild className="w-full">
            <Link to="/agendamentos" onClick={() => onOpenChange(false)}>
              Ver agenda completa
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
