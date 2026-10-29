import { useState } from 'react';
import { usePWA } from '../context/PWAContext';
import {
  Download,
  WifiOff,
  RefreshCw,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Radio
} from 'lucide-react';

export default function PWAInstallPrompt() {
  const {
    isInstalled,
    isOffline,
    swUpdateAvailable,
    showInstallModal,
    isIOS,
    hasNativePrompt,
    installApp,
    dismissInstallPrompt,
    openInstallPromptManual,
    updateServiceWorker,
  } = usePWA();

  const [mostrarGuiaManual, setMostrarGuiaManual] = useState(false);
  const [instalando, setInstalando] = useState(false);

  const handleInstalarClick = async () => {
    if (hasNativePrompt) {
      setInstalando(true);
      const resultado = await installApp();
      setInstalando(false);
      if (!resultado) {
        setMostrarGuiaManual(true);
      }
    } else {
      // Si el navegador no soporta el prompt directo (como Safari iOS o navegadores incrustados)
      setMostrarGuiaManual(true);
    }
  };

  return (
    <>
      {/* 1. Indicador de Conectividad Offline (Operaciones en Socavón sin 4G) */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#231908] border-b border-[#f59e0b]/50 px-4 py-2 text-center text-xs font-mono text-[#f59e0b] flex items-center justify-center gap-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-top">
          <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          <span>
            <strong>Modo Offline Activo:</strong> Tu telemetría, odómetro y checklists se guardan localmente hasta recuperar señal.
          </span>
        </div>
      )}

      {/* 2. Banner de Actualización de Flota Disponible */}
      {swUpdateAvailable && (
        <aside
          role="region"
          aria-label="Actualización disponible"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-[#07080a] border border-[#ff6363]/60 p-4 rounded-3xl shadow-2xl flex items-center gap-3 text-xs max-w-md animate-in slide-in-from-bottom"
        >
          <RefreshCw className="w-4 h-4 text-[#ff6363] animate-spin shrink-0" />
          <div className="flex-1">
            <div className="text-white font-bold">Nueva versión disponible</div>
            <div className="text-[#8e939e] text-[11px]">Se descargaron mejoras de sincronización en ruta.</div>
          </div>
          <button
            type="button"
            onClick={updateServiceWorker}
            className="btn-cockpit-action px-3.5 py-2 rounded-full text-xs font-bold font-mono cursor-pointer"
          >
            Actualizar
          </button>
        </aside>
      )}

      {/* 3. Modal Emergente Elegante y Profesional para Celular (Bottom Sheet / Modal) */}
      {showInstallModal && !isInstalled && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="w-full sm:max-w-md cockpit-panel border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-prompt-title"
          >
            {/* Cabecera con degradado y branding */}
            <div className="relative p-5 sm:p-6 pb-4 border-b border-white/[0.08] bg-gradient-to-b from-[#161a22] to-[#0b0d11]">
              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => dismissInstallPrompt(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-[#8e939e] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 pr-8">
                {/* Ícono de la App */}
                <div className="relative w-14 h-14 rounded-2xl bg-[#040506] border border-[#ff6363]/40 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-[#ff6363]/10">
                  <img
                    src="/pwa-192x192.png"
                    alt="VIP CAR Conductor"
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.currentTarget.src = '/logo-vipcar.png';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#59d499] text-black flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#ff6363] px-2 py-0.5 rounded-full bg-[#ff6363]/10 border border-[#ff6363]/30">
                      PWA OFICIAL
                    </span>
                    <span className="text-[10px] font-mono text-[#59d499] flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3" /> 100% Nativa
                    </span>
                  </div>
                  <h3 id="pwa-prompt-title" className="text-base sm:text-lg font-black text-white font-sans tracking-tight mt-1">
                    Instalar VIP CAR Conductor
                  </h3>
                  <p className="text-[11px] text-[#8e939e] font-mono">
                    Acceso directo en tu pantalla de inicio
                  </p>
                </div>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {!mostrarGuiaManual && !isIOS ? (
                <>
                  {/* Beneficios clave de instalar la aplicación */}
                  <div className="space-y-2.5">
                    <div className="telemetry-well p-3 rounded-2xl border border-white/[0.06] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#ff6363]/15 text-[#ff6363] shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <strong className="block text-white font-sans font-bold">
                          Acceso instantáneo en 1 toque
                        </strong>
                        <span className="text-[#8e939e] text-[11px] leading-snug">
                          Ábrela sin abrir el navegador ni tipear enlaces cada día al inicio de tu turno.
                        </span>
                      </div>
                    </div>

                    <div className="telemetry-well p-3 rounded-2xl border border-white/[0.06] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#59d499]/15 text-[#59d499] shrink-0 mt-0.5">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <strong className="block text-white font-sans font-bold">
                          Operatividad en Socavón & Offline
                        </strong>
                        <span className="text-[#8e939e] text-[11px] leading-snug">
                          Registra odómetro, combustible y checklist preoperacional aun sin señal 4G en interior mina.
                        </span>
                      </div>
                    </div>

                    <div className="telemetry-well p-3 rounded-2xl border border-white/[0.06] flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] shrink-0 mt-0.5">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <strong className="block text-white font-sans font-bold">
                          Telemetría & Botón SOS de Emergencia
                        </strong>
                        <span className="text-[#8e939e] text-[11px] leading-snug">
                          Alerta inmediata de averías mecánicas o choque con asistencia directa y reporte a supervisión.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#626773] font-mono px-1">
                    <span>Tamaño: &lt; 2 MB (Ligera y ultrarrápida)</span>
                    <button
                      type="button"
                      onClick={() => setMostrarGuiaManual(true)}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Instrucciones manuales
                    </button>
                  </div>
                </>
              ) : (
                /* Guía de instalación paso a paso (iOS o Navegadores sin prompt automático) */
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Instalación en {isIOS ? 'iPhone / Safari' : 'tu Navegador'}:</span>
                    <button
                      type="button"
                      onClick={() => setMostrarGuiaManual(false)}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer normal-case"
                    >
                      Volver
                    </button>
                  </div>

                  {isIOS ? (
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="telemetry-well p-3 rounded-2xl border border-white/[0.08] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <Share className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="block text-white font-bold">Paso 1:</strong>
                          <span>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</span>
                        </div>
                      </div>

                      <div className="telemetry-well p-3 rounded-2xl border border-white/[0.08] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#59d499]/20 text-[#59d499] flex items-center justify-center shrink-0">
                          <PlusSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="block text-white font-bold">Paso 2:</strong>
                          <span>Desliza hacia abajo y pulsa <strong>"Agregar a inicio"</strong> (+).</span>
                        </div>
                      </div>

                      <div className="telemetry-well p-3 rounded-2xl border border-white/[0.08] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#ff6363]/20 text-[#ff6363] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="block text-white font-bold">Paso 3:</strong>
                          <span>Toca <strong>"Agregar"</strong> en la esquina superior derecha y ¡listo!</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="telemetry-well p-3 rounded-2xl border border-white/[0.08] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#ff6363]/20 text-[#ff6363] flex items-center justify-center shrink-0 font-bold font-mono">
                          ⋮
                        </div>
                        <div>
                          <strong className="block text-white font-bold">Paso 1:</strong>
                          <span>Abre el menú de opciones de tu navegador (tres puntos ⋮ arriba a la derecha).</span>
                        </div>
                      </div>

                      <div className="telemetry-well p-3 rounded-2xl border border-white/[0.08] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#59d499]/20 text-[#59d499] flex items-center justify-center shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="block text-white font-bold">Paso 2:</strong>
                          <span>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="p-5 sm:p-6 pt-3 border-t border-white/[0.08] bg-[#07080a] flex items-center gap-3">
              <button
                type="button"
                onClick={() => dismissInstallPrompt(false)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-mono font-bold text-[#8e939e] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer text-center"
              >
                Más tarde
              </button>

              {!isIOS ? (
                <button
                  type="button"
                  onClick={handleInstalarClick}
                  disabled={instalando}
                  className="flex-[2] py-3.5 px-5 rounded-2xl btn-cockpit-action text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>{instalando ? 'Instalando...' : 'Instalar la App'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMostrarGuiaManual(true)}
                  className="flex-[2] py-3.5 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                >
                  <Share className="w-4 h-4" />
                  <span>Ver cómo instalar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Mini botón flotante discreto cuando no está instalada y el modal está cerrado */}
      {!isInstalled && !showInstallModal && (
        <aside
          role="region"
          aria-label="Acceso rápido para instalar la app"
          className="fixed bottom-3 right-3 z-40 animate-in fade-in duration-300"
        >
          <button
            type="button"
            onClick={openInstallPromptManual}
            className="group px-3 py-2 rounded-2xl bg-[#0e1115]/95 border border-[#ff6363]/40 hover:border-[#ff6363] text-white shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-mono cursor-pointer transition-all active:scale-95"
            title="Instalar VIP CAR Conductor en tu pantalla de inicio"
          >
            <div className="w-6 h-6 rounded-lg bg-[#ff6363]/20 flex items-center justify-center text-[#ff6363] group-hover:scale-110 transition-transform">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden xs:block">
              <span className="block text-[11px] font-bold text-white leading-tight">Instalar App</span>
              <span className="block text-[9px] text-[#59d499] leading-tight font-sans">1 toque</span>
            </div>
            <ChevronRight className="w-3 h-3 text-[#626773] group-hover:text-white" />
          </button>
        </aside>
      )}
    </>
  );
}
