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
  Briefcase,
  ChevronDown
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

  // Captura silenciosa de coordenadas GPS en segundo plano
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

      // Envío completo al Webhook de Google Sheets
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
      {/* Cabecera con Conductor Activo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/conductor')}
          className="p-2 rounded-full telemetry-well border border-white/[0.08] text-[#9c9c9d] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 truncate">
          <h1 className="text-lg font-black text-[#ff6363] flex items-center gap-1.5 font-sans">
            <AlertOctagon className="w-5 h-5 animate-pulse text-[#ff6363]" />
            Reporte de Avería SOS
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#8e939e] font-mono truncate">
            <span className="flex items-center gap-1 text-[#ff6363] truncate font-medium">
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
            ¡Alerta transmitida con éxito! Supervisión de flota y auxilio mecánico han sido notificados.
          </div>
        </div>
      )}

      {/* Selectores de Placa y Tipo de Servicio */}
      <div className="cockpit-panel border border-[#ff6363]/40 p-4 rounded-3xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#ff6363]" />
            <div className="text-xs text-white font-mono font-bold">
              Unidad Asignada
            </div>
          </div>
          <span className="font-mono font-bold text-xs text-[#ff6363] px-2.5 py-1 rounded-full telemetry-well border border-[#ff6363]/40">
            {assignedVehicle?.placa || DEFAULT_PLACA}
          </span>
        </div>

        {/* Selector de Placa con buscador */}
        <SearchableSelect
          label="Placa de la Unidad"
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

        <div className="w-full telemetry-well border border-white/[0.08] p-3.5 rounded-2xl text-xs text-slate-300 font-mono whitespace-normal leading-relaxed">
          {assignedVehicle?.marca || 'Toyota'} {assignedVehicle?.modelo || 'Hilux 4x4'} ({assignedVehicle?.tipo || 'Camioneta'}) • {assignedVehicle?.empresaAsignada || 'VIP CAR Huancayo'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 01. Ubicación del Incidente */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              01. Ubicación del Incidente *
            </label>
            <span className="text-[11px] font-mono text-[#8e939e]">Texto libre</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={ubicacionManual}
              onChange={(e) => {
                setUbicacionManual(e.target.value);
                setCurrentUbicacion(e.target.value);
              }}
              placeholder="Ej. Km 82 Carretera Central - Casapalca, Mina Cobriza..."
              className="w-full bg-[#07080a] telemetry-well border border-white/[0.12] focus:border-[#ff6363] rounded-2xl px-4 py-3 min-h-[50px] text-sm font-mono text-white placeholder-slate-500 focus:outline-none leading-relaxed transition-all shadow-inner"
            />
          </div>
        </div>

        {/* 02. Tipo de Falla o Incidente */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-[#ff6363]" />
            02. Tipo de Falla o Incidente *
          </label>
          <div className="relative flex items-center">
            <select
              value={tipoFalla}
              onChange={(e) => setTipoFalla(e.target.value)}
              className="w-full bg-[#07080a] telemetry-well border border-white/[0.12] focus:border-[#ff6363] rounded-2xl px-4 py-3 min-h-[50px] text-sm text-white focus:outline-none font-mono cursor-pointer appearance-none leading-relaxed pr-10 transition-all shadow-inner"
            >
              <option value="Falla mecánica (Motor / Caja / Tracción)">Falla mecánica (Motor / Caja / Tracción)</option>
              <option value="Falla en sistema de frenos">Falla en sistema de frenos</option>
              <option value="Neumático reventado / pinchado">Neumático reventado / pinchado</option>
              <option value="Accidente / Choque en operación o ruta">Accidente / Choque en operación o ruta</option>
              <option value="Falla eléctrica / Pértiga / Circulina">Falla eléctrica / Pértiga / Circulina</option>
              <option value="Fuga de refrigerante o aceite">Fuga de refrigerante o aceite</option>
              <option value="Otro incidente">Otro incidente</option>
            </select>
            <div className="pointer-events-none absolute right-4 flex items-center text-[#8e939e]">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 03. Nivel de Severidad */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold text-slate-200">
            03. Nivel de Severidad *
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'Leve', desc: 'Continúa operativo' },
              { id: 'Moderada', desc: 'Requiere taller' },
              { id: 'Grave', desc: 'Inhabilitada' },
            ].map((sev) => (
              <button
                type="button"
                key={sev.id}
                onClick={() => setSeveridad(sev.id)}
                className={`px-4 py-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[56px] leading-relaxed ${
                  severidad === sev.id
                    ? 'bg-[#ff6363] text-white font-bold border-[#ff6363] shadow-lg scale-[1.02]'
                    : 'telemetry-well text-[#9c9c9d] border-white/[0.08] hover:border-white/[0.2] hover:text-white'
                }`}
              >
                <div className="text-xs font-mono font-bold">{sev.id}</div>
                <div className="text-[10px] opacity-80 font-mono mt-0.5">{sev.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 04. Detalle de la Avería */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold text-slate-200">
            04. Detalle de la Avería *
          </label>
          <textarea
            required
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa el ruido, rotura, impacto, fuga o motivo del auxilio mecánico..."
            className="w-full bg-[#07080a] telemetry-well border border-white/[0.12] focus:border-[#ff6363] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none font-mono placeholder-slate-500 leading-relaxed transition-all shadow-inner resize-none"
          />
        </div>

        {/* Botones de Acción Inmediata: Llamada Directa + Enviar Reporte */}
        <div className="sticky bottom-4 z-10 space-y-2 backdrop-blur-md pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:920738888"
              className="w-full py-4 px-4 rounded-2xl sm:rounded-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-mono font-bold text-xs sm:text-sm shadow-xl border border-emerald-400/40 flex items-center justify-center gap-2 active:scale-98 cursor-pointer no-underline transition-all leading-relaxed"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>Llamada Directa (920738888)</span>
            </a>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 px-4 rounded-2xl sm:rounded-full bg-[#ff6363] hover:bg-[#e11d48] text-white font-bold text-xs sm:text-sm shadow-2xl transition-colors flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer font-mono leading-relaxed"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>
                {loading ? 'Transmitiendo Alerta...' : 'Enviar Reporte de Emergencia'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
