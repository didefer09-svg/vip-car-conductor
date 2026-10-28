/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // 1. Detectar si el usuario está navegando desde un dispositivo móvil
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const mobileByAgent = mobileRegex.test(userAgent);
      const mobileByScreen = window.innerWidth <= 768;
      const isMobileDevice = mobileByAgent || mobileByScreen;
      setIsMobile(isMobileDevice);

      // Detectar iOS (iPhone, iPad, iPod)
      const iosDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      setIsIOS(iosDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 2. Detectar si ya se está ejecutando como PWA instalada en pantalla de inicio (Standalone)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    const alreadyInstalled = checkIsInstalled();

    // 3. Capturar evento nativo `beforeinstallprompt` (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Si es móvil y no está instalada ni fue descartada en esta sesión, abrir popup
      const dismissed = sessionStorage.getItem('vipcar_pwa_dismissed');
      if (!alreadyInstalled && !dismissed) {
        setShowInstallModal(true);
      }
    };

    // 4. Detectar cuando la app ha sido instalada exitosamente
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      console.log('[PWA] VIP CAR Conductor instalada exitosamente en el dispositivo.');
    };

    // 5. Monitoreo de conectividad online/offline
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 6. Registro de Service Worker para PWA
    if ('serviceWorker' in navigator && import.meta.env?.MODE !== 'test') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado con éxito:', registration.scope);

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setSwUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] Error registrando Service Worker:', err);
          });
      });
    }

    // 7. Si es móvil y no está instalada, verificar si debemos mostrar el popup tras un breve delay elegante
    const timer = setTimeout(() => {
      if (!alreadyInstalled) {
        const userAgent = navigator.userAgent || '';
        const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || window.innerWidth <= 768;
        const dismissed = sessionStorage.getItem('vipcar_pwa_dismissed');
        if (isMob && !dismissed) {
          setShowInstallModal(true);
        }
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para disparar la instalación nativa de la app
  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Decisión de usuario:', outcome);

        if (outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
          setShowInstallModal(false);
          return true;
        }
      } catch (err) {
        console.warn('[PWA] Error al invocar prompt:', err);
      }
    }
    return false;
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback((permanent = false) => {
    setShowInstallModal(false);
    sessionStorage.setItem('vipcar_pwa_dismissed', 'true');
    if (permanent) {
      localStorage.setItem('vipcar_pwa_dismissed_permanent', 'true');
    }
  }, []);

  const openInstallPromptManual = useCallback(() => {
    setShowInstallModal(true);
  }, []);

  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isMobile,
        isIOS,
        isOffline,
        swUpdateAvailable,
        showInstallModal,
        setShowInstallModal,
        installApp,
        dismissInstallPrompt,
        openInstallPromptManual,
        updateServiceWorker,
        hasNativePrompt: Boolean(deferredPrompt),
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      isMobile: false,
      isIOS: false,
      isOffline: false,
      swUpdateAvailable: false,
      showInstallModal: false,
      setShowInstallModal: () => {},
      installApp: async () => false,
      dismissInstallPrompt: () => {},
      openInstallPromptManual: () => {},
      updateServiceWorker: () => {},
      hasNativePrompt: false,
    };
  }
  return context;
}
