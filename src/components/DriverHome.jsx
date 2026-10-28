import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFleet } from './FleetContext';
import { usePWA } from '../context/PWAContext';
import {
  Truck,
  Gauge,
  Fuel,
  ShieldCheck,
  ClipboardCheck,
  ClipboardX,
  AlertOctagon,
  Calendar,
  Clock,
  ArrowRight,
  CloudUpload,
  User,
  MapPin,
  Navigation,
  Settings,
  ExternalLink,
  Plus,
  Check,
  Download
} from 'lucide-react';
import SemaforoBadge from './SemaforoBadge';

export default function DriverHome() {
  const {
    vehicles,
    bitacora,
    pendingSyncCount,
    sincronizarColaManual,
    currentDriver,
    setCurrentDriver,
    currentTerminal,
    setCurrentTerminal,
    availableTerminals,
    addCustomTerminal,
    terminalCoordinates,
    selectedVehiclePlaca,
    setSelectedVehiclePlaca,
    selectedVehicle,
  } = useFleet();

  const { isInstalled, openInstallPromptManual } = usePWA();

  const fallbackVehicle = {
    placa: 'W4E-892',
    marca: 'Toyota',
    modelo: 'Hilux 4x4',
    tipo: 'Camioneta Pick-up',
    traccion: '4x4',
    empresaAsignada: 'VIP CAR Huancayo',
    odometroActual: 45280,
    nivelCombustible: 85,
    equipamiento: ['Jaula Antivuelco', 'Pértiga LED', 'GPS Satelital', 'Extintor 6kg'],
  };
  const myVehicle = selectedVehicle || (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) || (vehicles && vehicles[0]) || fallbackVehicle;
  const myLogs = (bitacora || []).filter((b) => b?.placa === myVehicle?.placa).slice(0, 3);

  // Estado para modal / panel de configuración rápida de conductor y terminal
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [nuevoTerminalInput, setNuevoTerminalInput] = useState('');
  const [mostrarAgregarTerminal, setMostrarAgregarTerminal] = useState(false);

  // Coordenadas para la vista de mapa en tiempo real
  const defaultTermCoords = terminalCoordinates[currentTerminal] || { latitud: -12.0651, longitud: -75.2049 };
  const [mapCoords, setMapCoords] = useState({
    lat: defaultTermCoords.latitud,
    lng: defaultTermCoords.longitud,
  });
  const [gpsEnVivo, setGpsEnVivo] = useState(false);
  const [buscandoGPS, setBuscandoGPS] = useState(false);

  // Obtener ubicación GPS al montar la vista
  useEffect(() => {
    if ('geolocation' in navigator) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuscandoGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsEnVivo(true);
          setBuscandoGPS(false);
        },
        () => {
          // Si falla, centra en las coordenadas del terminal activo
          const termCoords = terminalCoordinates[currentTerminal] || { latitud: -12.0651, longitud: -75.2049 };
          setMapCoords({ lat: termCoords.latitud, lng: termCoords.longitud });
          setGpsEnVivo(false);
          setBuscandoGPS(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [currentTerminal, terminalCoordinates]);

  const handleActualizarGPS = () => {
    if ('geolocation' in navigator) {
      setBuscandoGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsEnVivo(true);
          setBuscandoGPS(false);
        },
        () => {
          setBuscandoGPS(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleGuardarNuevoTerminal = (e) => {
    e.preventDefault();
    if (nuevoTerminalInput.trim()) {
      addCustomTerminal(nuevoTerminalInput.trim());
      setCurrentTerminal(nuevoTerminalInput.trim());
      setNuevoTerminalInput('');
      setMostrarAgregarTerminal(false);
    }
  };

  return (
    <div className="space-y-5 text-[#949aa6]">
      {/* 1. Cabecera Cockpit Simplificada con Input Libre de Conductor */}
      <div className="cockpit-panel rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-xl relative overflow-hidden space-y-4">
        {/* Fila Superior: Fecha y Estado del Turno */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07080a] border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ff6363] animate-pulse" />
            <span className="text-[#8e939e] font-bold text-[10px] uppercase tracking-wider">
              TURNO DE CONDUCCIÓN
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button
                type="button"
                onClick={openInstallPromptManual}
                className="px-2.5 py-1 rounded-full telemetry-well border border-[#ff6363]/40 text-[#ff6363] hover:text-white transition-colors cursor-pointer text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm"
                title="Instalar App en tu celular"
              >
                <Download className="w-3 h-3" />
                <span>Instalar</span>
              </button>
            )}
            <span className="text-[11px] text-[#8e939e] flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#ff6363]" />
              {new Date().toLocaleDateString('es-PE', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <button
              type="button"
              onClick={() => setModalConfigAbierto(true)}
              className="p-1.5 rounded-full telemetry-well border border-white/10 text-[#949aa6] hover:text-white transition-colors cursor-pointer"
              title="Ajustes de Turno"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fila Central: Input de Conductor Libre */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="input-conductor"
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8e939e] flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#ff6363]" />
              Conductor / Operador en Turno:
            </span>
            <span className="text-[10px] text-[#59d499] font-mono flex items-center gap-1">
              <Check className="w-3 h-3 text-[#59d499]" /> Guardado en este dispositivo
            </span>
          </label>

          <div className="relative">
            <input
              id="input-conductor"
              type="text"
              value={currentDriver}
              onChange={(e) => setCurrentDriver(e.target.value)}
              placeholder="Escribe tu nombre y apellido..."
              className="w-full bg-[#07080b] border border-white/[0.12] focus:border-[#ff6363] focus:ring-1 focus:ring-[#ff6363]/40 rounded-2xl px-4 py-3 text-lg sm:text-2xl font-black text-white placeholder-slate-600 font-sans transition-all outline-none"
            />
          </div>
        </div>

        <p className="text-[11px] text-[#626773] font-mono flex items-center gap-1.5">
          <span>Tus datos quedarán guardados y se asociarán a la bitácora, odómetro y telemetría de tu turno.</span>
        </p>
      </div>

      {/* Alerta de Sincronización Pendiente */}
      {pendingSyncCount > 0 && (
        <div className="bg-[#231908] border border-[#f59e0b]/50 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-[#f59e0b]">
            <CloudUpload className="w-5 h-5 animate-pulse shrink-0" />
            <div>
              <div className="font-bold font-mono">
                {pendingSyncCount} registro(s) pendientes
              </div>
              <div className="text-[11px] text-[#f59e0b]/80">
                Guardados localmente. Se sincronizan automáticamente con Firestore.
              </div>
            </div>
          </div>
          {navigator.onLine && (
            <button
              onClick={sincronizarColaManual}
              className="px-4 py-2 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs font-mono cursor-pointer transition-colors whitespace-nowrap shadow-md"
            >
              Subir Ahora
            </button>
          )}
        </div>
      )}

      {/* 2. Vista de Recorrido en Ruta (Google Maps Interactivo) */}
      <section className="cockpit-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Recorrido en Ruta // Monitoreo GPS
              </div>
              <div className="text-[10px] text-[#626773] font-mono">
                Ubicación satelital y tracking del móvil en servicio
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              gpsEnVivo
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                gpsEnVivo ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {buscandoGPS ? 'Sincronizando...' : gpsEnVivo ? 'GPS Activo' : 'Ubicación Terminal'}
          </span>
        </div>

        {/* Iframe interactivo de Google Maps */}
        <div className="relative w-full h-56 bg-slate-950">
          <iframe
            title="Recorrido en Ruta Google Maps"
            width="100%"
            height="100%"
            className="w-full h-full border-0"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=14&output=embed`}
          />
        </div>

        {/* Barra de telemetría y acciones del mapa */}
        <div className="p-3.5 bg-[#07080a] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              {mapCoords.lat.toFixed(4)}°, {mapCoords.lng.toFixed(4)}° • {currentTerminal}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleActualizarGPS}
              disabled={buscandoGPS}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/10 text-[11px] font-bold cursor-pointer transition-colors"
            >
              {buscandoGPS ? 'Buscando...' : 'Centrar GPS'}
            </button>
            <a
              href={`https://www.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <span>Ver App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Tarjeta Cockpit de Unidad Asignada con Flujo Horizontal Correcto */}
      <div className="w-full cockpit-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="w-full p-4 sm:p-5 border-b border-white/[0.08] flex flex-col gap-3.5">
          {/* Fila 1: Ícono, Nombre Completo del Modelo y Placa */}
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-[#ff6363]/15 border border-[#ff6363]/40 text-[#ff6363] flex items-center justify-center font-bold shrink-0 shadow-inner">
                <Truck className="w-5 h-5 text-[#ff6363]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-[#8e939e] font-bold uppercase tracking-wider font-mono">
                  Unidad Asignada • {myVehicle?.tipo || 'Pickup 4x4'} ({myVehicle?.traccion || '4x4'})
                </div>
                <h2 className="text-base sm:text-lg font-black text-white font-sans tracking-tight whitespace-normal leading-snug">
                  {myVehicle?.marca || 'Toyota'} {myVehicle?.modelo || 'Hilux 4x4'}
                </h2>
                <div className="text-[11px] text-[#626773] font-mono mt-0.5">
                  {myVehicle?.empresaAsignada || 'VIP CAR Huancayo'}
                </div>
              </div>
            </div>

            {/* Badge de Placa */}
            <div className="shrink-0">
              <span className="font-mono font-black text-sm sm:text-base text-[#ff6363] px-3.5 py-1.5 rounded-2xl telemetry-well border border-[#ff6363]/50 tracking-wider shadow-md inline-block">
                {myVehicle?.placa || 'W4E-892'}
              </span>
            </div>
          </div>

          {/* Fila 2: Selector Rápido de Flota */}
          <div className="w-full pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2.5 flex-wrap">
            <label htmlFor="select-unidad-home" className="text-[10px] text-[#8e939e] font-mono uppercase font-bold shrink-0">
              Cambiar unidad:
            </label>
            <div className="relative flex-1 min-w-[200px]">
              <select
                id="select-unidad-home"
                value={myVehicle?.placa || ''}
                onChange={(e) => setSelectedVehiclePlaca(e.target.value)}
                className="w-full bg-[#07080a] border border-white/[0.12] hover:border-[#ff6363]/50 focus:border-[#ff6363] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer appearance-none pr-8 truncate"
                title="Seleccionar otra unidad de la flota"
              >
                {(vehicles || []).map((v, idx) => (
                  <option key={v.id || v.placa} value={v.placa} className="bg-[#0e1115] text-white py-1">
                    #{String(idx + 1).padStart(2, '0')} • [{v.placa}] {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#ff6363]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Instrumentos de Odómetro y Combustible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="telemetry-well p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#626773] text-xs mb-1 font-mono">
                <Gauge className="w-3.5 h-3.5 text-[#ff6363]" />
                <span className="font-bold text-[10px] uppercase">Odómetro</span>
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {(myVehicle?.odometroActual ?? 0).toLocaleString()} <span className="text-xs font-normal text-[#626773]">km</span>
              </div>
            </div>

            <div className="telemetry-well p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#626773] text-xs mb-1 font-mono">
                <Fuel className="w-3.5 h-3.5 text-[#59d499]" />
                <span className="font-bold text-[10px] uppercase">Combustible</span>
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {myVehicle?.nivelCombustible ?? 75}%
              </div>
              <div className="w-full bg-[#040506] h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/10">
                <div
                  className={`h-full ${(myVehicle?.nivelCombustible ?? 75) > 30 ? 'bg-[#59d499]' : 'bg-[#ff6363]'}`}
                  style={{ width: `${myVehicle?.nivelCombustible ?? 75}%` }}
                />
              </div>
            </div>
          </div>

          {/* Semáforo Preventivo */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#626773] mb-1.5 flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff6363]" />
              Semáforo Preventivo de Mantenimiento:
            </div>
            <SemaforoBadge odometro={myVehicle?.odometroActual ?? 0} />
          </div>

          {/* Equipamiento Minero */}
          <div className="pt-2 border-t border-white/[0.08]">
            <div className="text-[9px] uppercase font-mono tracking-wider text-[#626773] mb-1.5 font-bold">
              Equipamiento Instalado:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(myVehicle?.equipamiento || []).map((eq, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono telemetry-well text-[#949aa6] border border-white/[0.08]"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Controladores Táctiles de Turno */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#626773] px-1 font-bold">
          Controladores de Turno
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/conductor/checkin"
            className="cockpit-panel rounded-3xl flex flex-col items-center justify-center p-4 transition-all text-center min-h-[96px] group active:scale-98 border border-white/[0.08] hover:border-[#59d499]/60 shadow-lg cursor-pointer"
          >
            <ClipboardCheck className="w-6 h-6 text-[#59d499] mb-1 group-hover:scale-108 transition-transform" />
            <span className="text-xs font-black text-white font-mono">INICIAR TURNO</span>
            <span className="text-[10px] text-[#626773] font-mono">Check-in & Odómetro</span>
          </Link>

          <Link
            to="/conductor/checkout"
            className="cockpit-panel rounded-3xl flex flex-col items-center justify-center p-4 transition-all text-center min-h-[96px] group active:scale-98 border border-white/[0.08] hover:border-[#f59e0b]/60 shadow-lg cursor-pointer"
          >
            <ClipboardX className="w-6 h-6 text-[#f59e0b] mb-1 group-hover:scale-108 transition-transform" />
            <span className="text-xs font-black text-white font-mono">FINALIZAR TURNO</span>
            <span className="text-[10px] text-[#626773] font-mono">Check-out & Entrega</span>
          </Link>
        </div>

        {/* Botón SOS Cápsula */}
        <Link
          to="/conductor/averia"
          className="w-full flex items-center justify-between p-4 px-6 rounded-full bg-gradient-to-r from-[#e11d48] to-[#be123c] hover:from-[#ff6363] hover:to-[#e11d48] text-white shadow-xl transition-all min-h-[60px] active:scale-98 border border-white/20 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-black/30">
              <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="text-left font-mono">
              <div className="text-xs font-black uppercase tracking-wider">
                Reportar Avería o Choque (SOS)
              </div>
              <div className="text-[10px] text-white/80">
                Alerta inmediata con foto y GPS al centro de control
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white" />
        </Link>
      </div>

      {/* 5. Historial Reciente */}
      <div className="cockpit-panel rounded-3xl p-5 border border-white/[0.08]">
        <h3 className="text-[10px] font-mono font-bold text-[#626773] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#ff6363]" />
          Bitácora de Turnos Recientes
        </h3>

        <div className="space-y-2.5">
          {(!myLogs || myLogs.length === 0) ? (
            <p className="text-xs text-[#626773] text-center py-3 font-mono">Sin registros previos.</p>
          ) : (
            (myLogs || []).map((log, idx) => (
              <div
                key={log?.id || idx}
                className="telemetry-well p-3 rounded-2xl flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="text-white font-bold">{log?.tipoRegistro}</div>
                  <div className="text-[10px] text-[#626773]">{log?.fechaHora} • {log?.proyecto}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{log?.odometro?.toLocaleString()} km</div>
                  <span className="text-[9px] text-[#59d499]">{log?.checklistEstado}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Configuración de Conductor y Terminal */}
      {modalConfigAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cockpit-panel border border-white/20 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#ff6363]" />
                Configurar Turno Activo
              </h3>
              <button
                type="button"
                onClick={() => setModalConfigAbierto(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Input de Conductor en Modal */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#ff6363]" />
                  Nombre del Conductor
                </span>
                <span className="text-[10px] text-[#59d499] font-mono">En tiempo real</span>
              </label>
              <input
                type="text"
                value={currentDriver}
                onChange={(e) => setCurrentDriver(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="w-full telemetry-well border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#ff6363] outline-none"
              />
            </div>

            {/* Selector y agregado de Terminal */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#ff6363]" />
                Terminal o Ubicación Base
              </label>
              <select
                value={currentTerminal}
                onChange={(e) => setCurrentTerminal(e.target.value)}
                className="w-full telemetry-well border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
              >
                {(availableTerminals || []).map((t) => (
                  <option key={t} value={t} className="bg-[#0b0d11]">
                    {t}
                  </option>
                ))}
              </select>

              {!mostrarAgregarTerminal ? (
                <button
                  type="button"
                  onClick={() => setMostrarAgregarTerminal(true)}
                  className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Agregar nueva ubicación a la lista
                </button>
              ) : (
                <form onSubmit={handleGuardarNuevoTerminal} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ej: Base Huancayo Sur"
                    value={nuevoTerminalInput}
                    onChange={(e) => setNuevoTerminalInput(e.target.value)}
                    className="flex-1 telemetry-well border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Guardar
                  </button>
                </form>
              )}
            </div>

            {/* Selector de Unidad de Flota en Modal */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#ff6363]" />
                  Vehículo de Flota Asignado
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {(vehicles || []).length} unidades
                </span>
              </label>
              <select
                value={myVehicle?.placa || ''}
                onChange={(e) => setSelectedVehiclePlaca(e.target.value)}
                className="w-full telemetry-well border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
              >
                {(vehicles || []).map((v, idx) => (
                  <option key={v.id || v.placa} value={v.placa} className="bg-[#0b0d11]">
                    #{String(idx + 1).padStart(2, '0')} • [{v.placa}] {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setModalConfigAbierto(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-lg"
            >
              Listo / Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
