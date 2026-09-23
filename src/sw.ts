/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching"

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

interface PushPayload {
  title?: string
  body?: string
  data?: { url?: string }
}

self.addEventListener("push", (event) => {
  const data: PushPayload = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "KirvoAgenda", {
      body: data.body,
      icon: "/icon-192.png",
      data: data.data,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? "/agendamentos"
  event.waitUntil(self.clients.openWindow(url))
})
