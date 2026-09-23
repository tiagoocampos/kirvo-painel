import { api } from "@/services/api"
import type { NotificationsPage } from "@/types"

export function listNotifications(params: { cursor?: string; limit?: number }) {
  return api.get<NotificationsPage>("/notifications", { params })
}

export function getUnreadNotificationCount() {
  return api.get<{ count: number }>("/notifications/unread-count")
}

export function markAllNotificationsRead() {
  return api.patch("/notifications/read-all")
}
