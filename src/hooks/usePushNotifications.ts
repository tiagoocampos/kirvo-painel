import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from "@/services/push"
import { getApiErrorMessage } from "@/lib/utils-api"
import { isPushSupported, urlBase64ToUint8Array } from "@/lib/pwa"

type PushPermission = "default" | "granted" | "denied" | "unsupported"

interface UsePushNotificationsResult {
  permission: PushPermission
  subscribed: boolean
  loading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsResult {
  const supported = isPushSupported()
  const [permission, setPermission] = useState<PushPermission>(
    supported ? (Notification.permission as PushPermission) : "unsupported"
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supported) return
    let active = true
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (active) setSubscribed(subscription !== null)
      })
      .catch(() => {
        // Sem service worker pronto ainda (ex: primeira visita) — trata como não inscrito.
      })
    return () => {
      active = false
    }
  }, [supported])

  async function subscribe() {
    if (!supported) return
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== "granted") return

      const registration = await navigator.serviceWorker.ready
      const { data } = await getVapidPublicKey()
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
      })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return

      await subscribeToPush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      })
      setSubscribed(true)
      toast.success("Notificações ativadas!", { position: "top-center" })
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível ativar as notificações"), {
        position: "top-center",
      })
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    if (!supported) return
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await unsubscribeFromPush(subscription.endpoint)
      }
      setSubscribed(false)
      toast.success("Notificações desativadas.", { position: "top-center" })
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível desativar as notificações"), {
        position: "top-center",
      })
    } finally {
      setLoading(false)
    }
  }

  return { permission, subscribed, loading, subscribe, unsubscribe }
}
