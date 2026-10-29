import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from './FleetContext';
import {
  AlertOctagon,
  ArrowLeft,
  Truck,
  PhoneCall,
  CheckCircle2,
  User,
  MapPin,
  Briefcase
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import {
  OFFICIAL_UNIDADES,
  OFFICIAL_SERVICIOS,
  DEFAULT_PLACA,
  DEFAULT_SERVICIO,
  DEFAULT_UBICACION,
} from '../data/fleetData';

export default function ReportarAveria() {
  const navigate = useNavigate();
  const {
    vehicles,
    reportarAveriaEmergencia,
    currentDriver,
    selectedVehiclePlaca,
    setSelectedVehiclePlaca,
    selectedVehicle,
    selectedService,
    setSelectedService,
    currentUbicacion,
    setCurrentUbicacion,
  } = useFleet();

  const fallbackVehicle = {
    placa: DEFAULT_PLACA,
    marca: 'Toyota',
    modelo: 'Hilux 4x4 (UM-01)',
    tipo: 'Camioneta',
    empresaAsignada: 'VIP CAR Huancayo',
    odometroActual: 45280,
    nivelCombustible: 75,
  };

  const assignedVehicle =
    selectedVehicle ||
    (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) ||
    (vehicles && vehicles[0]) ||
    fallbackVehicle;

  // Estados del formulario
  const [servicio, setServicio] = useState(selectedService || DEFAULT_SERVICIO);
  const [ubicacionManual, setUbicacionManual] = useState(currentUbicacion || DEFAULT_UBICACION);
  const [tipoFalla, setTipoFalla] = useState('Falla mecánica (Motor / Caja / Tracción)');
  const [severidad, setSeveridad] = useState('Grave');
  const [descripcion, setDescripcion] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Captura silenciosa de coordenadas GPS en segundo plano (Requerimiento 2: Sin botón visible de GPS)
  const [gpsCoords, setGpsCoords] = useState({
    latitud: -12.0651,
    longitud: -75.2049,
    precision: 50,
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision: Math.round(pos.coords.accuracy),
          });
        },
        () => {
          // Mantener respaldo silencioso
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fechaHoraActual = new Date().toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const targetPlaca = assignedVehicle?.placa || selectedVehiclePlaca || DEFAULT_PLACA;
    const targetServicio = servicio || selectedService || DEFAULT_SERVICIO;
    const targetUbicacion = ubicacionManual.trim() || currentUbicacion || DEFAULT_UBICACION;

    setCurrentUbicacion(targetUbicacion);
    setSelectedService(targetServicio);

    const estadoGeneral = `Emergencia / Avería [${severidad}]`;
    const resumenChecklist = `SOS: ${tipoFalla} (${severidad})`;

    try {
      await reportarAveriaEmergencia({
        placa: targetPlaca,
        vehiculoId: assignedVehicle?.id,
        tipoFalla,
        severidad,
        descripcion: descripcion.trim(),
        conductor: currentDriver,
        servicio: targetServicio,
        ubicacion: targetUbicacion,
        foto: null,
        latitud: gpsCoords?.latitud || null,
        longitud: gpsCoords?.longitud || null,
        precision: gpsCoords?.precision || null,
      });

      // Envío completo al Webhook de Google Sheets (Requerimiento 4)
      const payloadWebhook = {
        'Fecha/Hora': fechaHoraActual,
        'Acción': 'SOS',
        'Nombre del Conductor': currentDriver,
        'Placa seleccionada': targetPlaca,
        'Servicio seleccionado': targetServicio,
        'Ubicación escrita manualmente': targetUbicacion,
        'Kilometraje': Number(assignedVehicle?.odometroActual || 0),
        'Combustible (%)': `${assignedVehicle?.nivelCombustible || 0}%`,
        'Estado General': estadoGeneral,
        'Resumen del Checklist': resumenChecklist,
        'Observaciones': descripcion.trim(),
        'Coordenadas GPS': gpsCoords ? `${gpsCoords.latitud}, ${gpsCoords.longitud}` : 'Sin GPS',

        // Claves técnicas de compatibilidad
        fechaHora: fechaHoraActual,
        tipoEvento: 'SOS',
        accion: 'SOS',
        conductor: currentDriver,
        operador: currentDriver,
        placa: targetPlaca,
        servicio: targetServicio,
        tipoServicio: targetServicio,
        ubicacion: targetUbicacion,
        tipoFalla,
        severidad,
        checklist_condicion: `${tipoFalla} [${severidad}]`,
        estadoGeneral,
        resumenChecklist,
        observaciones: descripcion.trim(),
        odometro: Number(assignedVehicle?.odometroActual || 0),
        combustible: Number(assignedVehicle?.nivelCombustible || 0),
        latitud: gpsCoords?.latitud || null,
        longitud: gpsCoords?.longitud || null,
      };

      try {
        await fetch(
          'https://script.google.com/macros/s/AKfycbz2tPas7ur3GYyWcKEPG9KaRI8QWzoV0-8xY9zuCCGK7j3Ht6M5ZFjuJA-ZP4shy5zTuQ/exec',
          {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payloadWebhook),
          }
        );
      } catch (webhookErr) {
        console.warn('Error al enviar al Webhook de Google Sheets:', webhookErr);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/conductor');
      }, 2000);
    } catch (err) {
      console.error('Error al reportar avería SOS:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[#9c9c9d] pb-8">
      {/* Header SOS con Conductor Activo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/conductor')}
          className="p-2 rounded-full telemetry-well border border-white/[0.08] text-[#9c9c9d] hover:text-[#ffffff] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 truncate">
          <h1 className="text-lg font-black text-[#ff6363] flex items-center gap-1.5 font-sans">
            <AlertOctagon className="w-5 h-5 animate-pulse text-[#ff6363]" />
            Reporte de Avería SOS
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-[#6a6b6c] font-mono truncate">
            <span className="flex items-center gap-1 text-[#ff6363] truncate">
              <User className="w-3 h-3" />
              {currentDriver || 'Conductor no especificado'}
            </span>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-[#ff6363] text-white flex items-center gap-3 shadow-xl font-mono animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div className="text-xs font-bold leading-relaxed">
            ¡ALERTA TRANSMITIDA A GOOGLE SHEETS Y FIRESTORE! Supervisión de flota y auxilio mecánico han sido notificados.
          </div>
        </div>
      )}

      {/* Selectores de Placa y Tipo de Servicio (Requerimiento 1) */}
      <div className="cockpit-panel border border-[#ff6363]/40 p-4 rounded-3xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#ff6363]" />
            <div className="text-[10px] text-[#ff6363] uppercase font-mono font-bold">
              Unidad Afectada // Selector Oficial
            </div>
          </div>
          <span className="font-mono font-bold text-xs text-[#ff6363] px-2.5 py-0.5 rounded-full telemetry-well border border-[#ff6363]/40">
            {assignedVehicle?.placa || DEFAULT_PLACA}
          </span>
        </div>

        {/* Selector de Placa con buscador */}
        <SearchableSelect
          label="Placa de la Unidad con Falla"
          options={OFFICIAL_UNIDADES}
          value={assignedVehicle?.placa || selectedVehiclePlaca}
          onChange={(newPlaca) => setSelectedVehiclePlaca(newPlaca)}
          placeholder="Buscar placa afectada (ej. BHF-821)..."
          icon={Truck}
        />

        {/* Selector de Tipo de Servicio */}
        <SearchableSelect
          label="Servicio en Ejecución"
          options={OFFICIAL_SERVICIOS}
          value={servicio}
          onChange={(val) => {
            setServicio(val);
            setSelectedService(val);
          }}
          placeholder="Buscar tipo de servicio..."
          icon={Briefcase}
        />

        <div className="w-full telemetry-well border border-white/[0.08] p-3 rounded-2xl text-[11px] text-slate-300 font-mono whitespace-normal leading-snug">
          {assignedVehicle?.marca || 'Toyota'} {assignedVehicle?.modelo || 'Hilux 4x4'} ({assignedVehicle?.tipo || 'Camioneta'}) • {assignedVehicle?.empresaAsignada || 'VIP CAR Huancayo'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ubicación / Terminal en Texto Libre (Requerimiento 2: Sin botón de GPS) */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              01 // Ubicación del Incidente *
            </label>
            <span className="text-[10px] font-mono text-[#6a6b6c]">Texto libre</span>
          </div>
          <input
            type="text"
            required
            value={ubicacionManual}
            onChange={(e) => {
              setUbicacionManual(e.target.value);
              setCurrentUbicacion(e.target.value);
            }}
            placeholder="ej. Km 82 Carretera Central - Casapalca, Mina Cobriza..."
            className="w-full telemetry-well border border-white/[0.1] rounded-2xl px-4 py-3 text-xs font-mono font-semibold text-[#ffffff] placeholder-[#6a6b6c] focus:outline-none focus:border-[#ff6363] transition-colors"
          />
        </div>

        {/* Tipo de falla */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            02 // Tipo de Falla o Incidente *
          </label>
          <select
            value={tipoFalla}
            onChange={(e) => setTipoFalla(e.target.value)}
            className="w-full telemetry-well border border-white/[0.08] rounded-2xl p-3 text-xs text-[#ffffff] focus:outline-none focus:border-[#ff6363] font-mono cursor-pointer"
          >
            <option value="Falla mecánica (Motor / Caja / Tracción)">Falla mecánica (Motor / Caja / Tracción)</option>
            <option value="Falla en sistema de frenos">Falla en sistema de frenos</option>
            <option value="Neumático reventado / pinchado">Neumático reventado / pinchado</option>
            <option value="Accidente / Choque en operación o ruta">Accidente / Choque en operación o ruta</option>
            <option value="Falla eléctrica / Pértiga / Circulina">Falla eléctrica / Pértiga / Circulina</option>
            <option value="Fuga de refrigerante o aceite">Fuga de refrigerante o aceite</option>
            <option value="Otro incidente">Otro incidente</option>
          </select>
        </div>

        {/* Severidad */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            03 // Nivel de Severidad *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Leve', desc: 'Continúa operativo' },
              { id: 'Moderada', desc: 'Requiere taller' },
              { id: 'Grave', desc: 'Inhabilitada' },
            ].map((sev) => (
              <button
                type="button"
                key={sev.id}
                onClick={() => setSeveridad(sev.id)}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  severidad === sev.id
                    ? 'bg-[#ff6363] text-white font-bold border-[#ff6363] shadow-md'
                    : 'telemetry-well text-[#9c9c9d] border-white/[0.08] hover:border-white/[0.2]'
                }`}
              >
                <div className="text-xs font-mono font-bold">{sev.id}</div>
                <div className="text-[10px] opacity-80 font-mono">{sev.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            04 // Detalle de la Avería *
          </label>
          <textarea
            required
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa el ruido, rotura, impacto, fuga o motivo del auxilio mecánico..."
            className="w-full telemetry-well border border-white/[0.08] rounded-2xl p-3 text-xs text-[#ffffff] focus:outline-none focus:border-[#ff6363] font-mono placeholder-[#6a6b6c]"
          />
        </div>

        {/* Panel Destacado de Contacto de Auxilio Inmediato (En reemplazo de foto de evidencia) */}
        <div className="cockpit-panel border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-[#0a120e] to-[#070c0a] p-5 rounded-3xl space-y-3.5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  05 // Contacto de Auxilio Inmediato (24/7)
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono">
                  Supervisión y Asistencia Mecánica en Ruta
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
              Línea Activa 24h
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Número de Emergencia Oficial:</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
                +51 940 341 196
              </div>
            </div>
            <a
              href="tel:+51940341196"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform cursor-pointer no-underline shrink-0 border border-emerald-400/40"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Llamar Ahora</span>
            </a>
          </div>
        </div>

        {/* Botones de Acción Inmediata: Llamada Directa + Enviar Reporte */}
        <div className="sticky bottom-4 z-10 space-y-2 backdrop-blur-md pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:+51940341196"
              className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-mono font-black text-xs sm:text-sm shadow-xl border border-emerald-400/40 flex items-center justify-center gap-2 active:scale-98 cursor-pointer no-underline transition-all"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>LLAMADA DIRECTA (+51 940 341 196)</span>
            </a>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 rounded-full bg-[#ff6363] hover:bg-[#e11d48] text-white font-black text-xs sm:text-sm shadow-2xl transition-colors flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer font-mono"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>
                {loading ? 'TRANSMITIENDO SOS...' : 'ENVIAR REPORTE DE EMERGENCIA'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
