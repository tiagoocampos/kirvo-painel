import { useEffect, useState } from "react"
import { getUnreadNotificationCount } from "@/services/notifications"

const POLL_INTERVAL_MS = 30_000

// Contagem de não lidas pro badge do sino. Fica sempre ativo enquanto o
// painel está aberto (não depende do sheet estar aberto) — mesmo padrão de
// polling simples já usado no resto do painel, sem WebSocket/SSE.
// setCount é exposto pra zerar o badge na hora ao marcar tudo como lido, sem
// esperar o próximo ciclo do polling.
export function useUnreadNotificationCount(enabled: boolean): [number, (count: number) => void] {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }

    let active = true

    async function load() {
      try {
        const response = await getUnreadNotificationCount()
        if (active) setCount(response.data.count)
      } catch {
        // Polling em background — falha silenciosa, não interrompe o uso do painel.
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [enabled])

  return [count, setCount]
}
