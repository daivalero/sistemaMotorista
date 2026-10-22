import { useEffect, useState } from 'react'
import { Download, Share, WifiOff, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function PwaManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useRegisterSW({
    onRegisterError(error) {
      console.error('Falha ao registrar o service worker:', error)
    },
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setShowInstall(true)
    }
    const handleInstalled = () => {
      setInstallEvent(null)
      setShowInstall(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    const iosTimer = window.setTimeout(() => {
      if (isIos() && !isStandalone()) setShowInstall(true)
    }, 2500)

    return () => {
      window.clearTimeout(iosTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function installApp() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setInstallEvent(null)
  }

  const shouldShowInstall =
    showInstall && !dismissed && !isStandalone() && (installEvent || isIos())

  return (
    <>
      {!isOnline && (
        <div role="status" className="pwa-offline">
          <WifiOff size={16} aria-hidden />
          Sem internet — as rotas desta demonstração continuam disponíveis neste aparelho.
        </div>
      )}

      {shouldShowInstall && (
        <aside aria-label="Instalar aplicativo" className="pwa-install">
          <button
            type="button"
            className="pwa-install-close"
            onClick={() => setDismissed(true)}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          <div className="pwa-install-body">
            <span className="pwa-install-icon" aria-hidden>
              {installEvent ? <Download size={20} /> : <Share size={20} />}
            </span>
            <div>
              <p className="pwa-install-title">Instale o Braulio</p>
              {installEvent ? (
                <>
                  <p className="pwa-install-copy">
                    Acesse mais rápido e use o app mesmo com conexão instável.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={() => void installApp()}>
                    Instalar aplicativo
                  </button>
                </>
              ) : (
                <p className="pwa-install-copy">
                  No navegador, toque em <strong>Compartilhar</strong> e depois em{' '}
                  <strong>Adicionar à Tela de Início</strong>.
                </p>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
