import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFleet } from './FleetContext';
import { usePWA } from '../context/PWAContext';
import SearchableSelect from './SearchableSelect';
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
  Settings,
  Check,
  Download,
  Briefcase
} from 'lucide-react';
import SemaforoBadge from './SemaforoBadge';

export default function DriverHome() {
  const {
    vehicles,
    unidades,
    servicios,
    bitacora,
    pendingSyncCount,
    sincronizarColaManual,
    currentDriver,
    setCurrentDriver,
    currentUbicacion,
    setCurrentUbicacion,
    selectedVehiclePlaca,
    setSelectedVehiclePlaca,
    selectedService,
    setSelectedService,
    selectedVehicle,
  } = useFleet();

  const { isInstalled, openInstallPromptManual } = usePWA();

  const fallbackVehicle = {
    placa: 'BHF-821',
    marca: 'Toyota',
    modelo: 'Hilux 4x4',
    tipo: 'Camioneta',
    tipoDetalle: 'Camioneta - VIP CAR - UM-01',
    codigo: 'UM-01',
    traccion: '4x4',
    empresaAsignada: 'VIP CAR Huancayo',
    odometroActual: 45280,
    nivelCombustible: 80,
    equipamiento: ['Jaula Antivuelco', 'Pértiga LED', 'GPS Satelital', 'Extintor 6kg'],
  };

  const myVehicle =
    selectedVehicle ||
    (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) ||
    (vehicles && vehicles[0]) ||
    fallbackVehicle;

  const myLogs = (bitacora || []).filter((b) => b?.placa === myVehicle?.placa).slice(0, 3);

  // Estado para modal / panel de configuración rápida
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);

  return (
    <div className="space-y-5 text-[#949aa6]">
      {/* 1. Cabecera Cockpit con Input de Conductor y Ubicación Manual */}
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
              <Check className="w-3 h-3 text-[#59d499]" /> Guardado en este equipo
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

        {/* Fila 2: Ubicación / Terminal en Texto Libre (Requerimiento 2) */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="input-ubicacion-home"
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8e939e] flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Ubicación Actual / Dónde estás:
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Texto libre manual</span>
          </label>

          <div className="relative">
            <input
              id="input-ubicacion-home"
              type="text"
              value={currentUbicacion}
              onChange={(e) => setCurrentUbicacion(e.target.value)}
              placeholder="Ej: Cochera Huancayo, Aeropuerto Jauja, Socavón..."
              className="w-full bg-[#07080b] border border-white/[0.12] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-slate-600 font-mono transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Selectores Manuales Oficiales: Placa (30 equipos) y Tipo de Servicio (16 servicios) */}
      <div className="cockpit-panel rounded-3xl p-5 border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#ff6363]" />
            <span>Asignación de Unidad & Servicio</span>
          </div>
          <span className="text-[10px] font-mono text-[#59d499] bg-[#59d499]/10 px-2 py-0.5 rounded-full border border-[#59d499]/30 font-bold">
            30 Unidades • 16 Servicios
          </span>
        </div>

        {/* Selector de Placa con Buscador */}
        <SearchableSelect
          id="select-unidad-home"
          label="Unidad Asignada (Placa)"
          icon={Truck}
          value={selectedVehiclePlaca}
          onChange={(newPlaca) => setSelectedVehiclePlaca(newPlaca)}
          options={(unidades || []).map((u) => ({
            value: u.placa,
            label: `${u.placa} • ${u.tipo}`,
            sublabel: u.tipoDetalle,
            badge: u.codigo,
          }))}
          placeholder="Filtrar por placa (ej: BHF, W7W, Sprinter, Bus...)"
          helperText="Elige la unidad que estás operando para registrar odómetro y checklist."
        />

        {/* Selector de Servicio con Buscador */}
        <SearchableSelect
          id="select-servicio-home"
          label="Tipo de Servicio Actual"
          icon={Briefcase}
          value={selectedService}
          onChange={(newServicio) => setSelectedService(newServicio)}
          options={(servicios || []).map((s) => ({
            value: s,
            label: s,
            sublabel: '',
            badge: 'Servicio',
          }))}
          placeholder="Filtrar servicio (ej: Aeropuerto, Almacén, OCP, Lima...)"
          helperText="Servicio corporativo o ruta activa asignada a este turno."
        />
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

      {/* 2. Tarjeta Cockpit de la Unidad Seleccionada */}
      <div className="w-full cockpit-panel rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="w-full p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-[#ff6363]/15 border border-[#ff6363]/40 text-[#ff6363] flex items-center justify-center font-bold shrink-0 shadow-inner">
              <Truck className="w-5 h-5 text-[#ff6363]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-[#8e939e] font-bold uppercase tracking-wider font-mono">
                {myVehicle?.tipoDetalle || `${myVehicle?.tipo} • ${myVehicle?.codigo || 'VIP CAR'}`}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-sans tracking-tight whitespace-normal leading-snug">
                {myVehicle?.marca || 'Unidad'} {myVehicle?.modelo || ''}
              </h2>
              <div className="text-[11px] text-cyan-400 font-mono mt-0.5 truncate">
                {selectedService}
              </div>
            </div>
          </div>

          {/* Badge de Placa */}
          <div className="shrink-0">
            <span className="font-mono font-black text-sm sm:text-base text-[#ff6363] px-3.5 py-1.5 rounded-2xl telemetry-well border border-[#ff6363]/50 tracking-wider shadow-md inline-block">
              {myVehicle?.placa || selectedVehiclePlaca}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Instrumentos de Odómetro y Combustible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="telemetry-well p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[#626773] text-xs mb-1 font-mono">
                <Gauge className="w-3.5 h-3.5 text-[#ff6363]" />
                <span className="font-bold text-[10px] uppercase">Odómetro Base</span>
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {(myVehicle?.odometroActual ?? 45280).toLocaleString()} <span className="text-xs font-normal text-[#626773]">km</span>
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
            <SemaforoBadge odometro={myVehicle?.odometroActual ?? 45280} />
          </div>

          {/* Equipamiento Instalado */}
          <div className="pt-2 border-t border-white/[0.08]">
            <div className="text-[9px] uppercase font-mono tracking-wider text-[#626773] mb-1.5 font-bold">
              Equipamiento Registrado:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(myVehicle?.equipamiento || ['Extintor 6kg', 'Botiquín', 'Tacos (2)', 'Conos (2)', 'Kit Antiderrame']).map((eq, idx) => (
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
            <span className="text-[10px] text-[#626773] font-mono">Checklist 43 Puntos & Odómetro</span>
          </Link>

          <Link
            to="/conductor/checkout"
            className="cockpit-panel rounded-3xl flex flex-col items-center justify-center p-4 transition-all text-center min-h-[96px] group active:scale-98 border border-white/[0.08] hover:border-[#f59e0b]/60 shadow-lg cursor-pointer"
          >
            <ClipboardX className="w-6 h-6 text-[#f59e0b] mb-1 group-hover:scale-108 transition-transform" />
            <span className="text-xs font-black text-white font-mono">FINALIZAR TURNO</span>
            <span className="text-[10px] text-[#626773] font-mono">Check-out & Odómetro Cierre</span>
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
                Llamada directa de auxilio (+51 940 341 196) y alerta satelital
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
                  <div className="text-white font-bold">{log?.tipoRegistro || log?.tipoEvento}</div>
                  <div className="text-[10px] text-[#626773]">
                    {log?.fechaHora} • [{log?.placa}] • {log?.servicio || log?.proyecto}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{(log?.odometro || log?.kilometraje)?.toLocaleString()} km</div>
                  <span className="text-[9px] text-[#59d499]">{log?.checklistResumen || log?.checklistEstado}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Configuración Rápida de Turno */}
      {modalConfigAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cockpit-panel border border-white/20 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#ff6363]" />
                Ajustes Rápidos de Turno
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
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#ff6363]" />
                  Nombre del Conductor
                </span>
              </label>
              <input
                type="text"
                value={currentDriver}
                onChange={(e) => setCurrentDriver(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="w-full telemetry-well border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#ff6363] outline-none"
              />
            </div>

            {/* Input de Ubicación en Modal */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Ubicación Manual
              </label>
              <input
                type="text"
                value={currentUbicacion}
                onChange={(e) => setCurrentUbicacion(e.target.value)}
                placeholder="Ej: Cochera Huancayo, Aeropuerto..."
                className="w-full telemetry-well border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setModalConfigAbierto(false)}
              className="w-full py-3 rounded-2xl btn-cockpit-action text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Listo / Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
