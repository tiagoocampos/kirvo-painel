// Converte a chave pública VAPID (base64url) pro formato Uint8Array exigido
// por PushManager.subscribe.
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}
