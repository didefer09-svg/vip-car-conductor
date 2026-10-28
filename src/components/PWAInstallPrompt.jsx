import { useState } from 'react';
import { usePWA } from '../../context/PWAContext';
import {
  Download,
  WifiOff,
  RefreshCw,
  X
} from 'lucide-react';

export default function PWAInstallPrompt() {
  const {
    isInstallable,
    isInstalled,
    isOffline,
    swUpdateAvailable,
    installApp,
    updateServiceWorker
  } = usePWA();

  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {/* 1. Indicador de Conectividad Offline (Operaciones Mineras sin señal 4G) */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#231908] border-b border-[#f59e0b]/40 px-4 py-1.5 text-center text-xs font-mono text-[#f59e0b] flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>
            <strong>Modo Sin Conexión Activo:</strong> Operando con caché local y telemetría offline de campo.
          </span>
        </div>
      )}

      {/* 2. Banner de Actualización de Versión Disponible */}
      {swUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-[#07080a] border border-[#ff6363]/60 p-4 rounded-3xl shadow-2xl flex items-center gap-3 text-xs max-w-md animate-in slide-in-from-bottom">
          <RefreshCw className="w-4 h-4 text-[#ff6363] animate-spin shrink-0" />
          <div className="flex-1">
            <div className="text-white font-bold">Actualización de Flota Disponible</div>
            <div className="text-[#6a6b6c] text-[11px]">Se han descargado nuevas mejoras operativas.</div>
          </div>
          <button
            onClick={updateServiceWorker}
            className="btn-raycast-primary px-4 py-2 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Actualizar
          </button>
        </div>
      )}

      {/* 3. Modal / Banner Flotante para Instalar la PWA */}
      {isInstallable && !dismissed && !isInstalled && (
        <aside
          role="region"
          aria-label="Instalación de Aplicación PWA"
          className="fixed bottom-5 right-5 z-40 cockpit-panel border border-white/[0.08] hover:border-[#ff6363]/60 rounded-3xl p-5 shadow-2xl max-w-sm w-full mx-auto transition-all animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#111214] border border-white/[0.08] flex items-center justify-center shrink-0">
                <img
                  src="/pwa-192x192.png"
                  alt="VIP CAR"
                  className="w-7 h-7 object-contain rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Instalar VIP CAR B2B</h4>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#111214] text-[#ff6363] border border-[#ff6363]/30">
                    APP
                  </span>
                </div>
                <p className="text-[11px] text-[#6a6b6c] mt-0.5 leading-snug">
                  Accede al cockpit, odómetro de campo y contratos directamente desde tu escritorio o móvil.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="text-[#6a6b6c] hover:text-white p-1.5 rounded-full hover:bg-white/[0.05] transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-3.5 py-1.5 rounded-full text-[11px] text-[#6a6b6c] hover:text-white transition-colors cursor-pointer"
            >
              Más tarde
            </button>
            <button
              onClick={installApp}
              className="btn-raycast-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar Aplicación</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
