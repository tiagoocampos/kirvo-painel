import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

interface InstallPromptContextValue {
  canInstall: boolean
  promptInstall: () => Promise<void>
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null)

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Impede o mini-infobar padrão do navegador — mostramos nosso próprio botão.
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => setDeferredPrompt(null)

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const value: InstallPromptContextValue = {
    // Some no Safari/iOS e em navegadores sem suporte — o evento nunca dispara,
    // então o botão simplesmente não aparece (instalação lá é manual, via menu de compartilhamento).
    canInstall: deferredPrompt !== null,
    promptInstall,
  }

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>
}

export function useInstallPrompt(): InstallPromptContextValue {
  const context = useContext(InstallPromptContext)
  if (!context) throw new Error("useInstallPrompt must be used within an InstallPromptProvider")
  return context
}
