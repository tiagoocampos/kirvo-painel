import { api } from "@/services/api"

export function getVapidPublicKey() {
  return api.get<{ publicKey: string }>("/push/vapid-public-key")
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export function subscribeToPush(subscription: PushSubscriptionInput) {
  return api.post("/push/subscription", subscription)
}

export function unsubscribeFromPush(endpoint: string) {
  return api.delete("/push/subscription", { data: { endpoint } })
}
