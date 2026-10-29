import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from './FleetContext';
import {
  ClipboardX,
  Gauge,
  Fuel,
  ArrowLeft,
  Truck,
  AlertCircle,
  CheckCircle2,
  Zap,
  User,
  MapPin,
  Briefcase
} from 'lucide-react';
import FuelGauge from './FuelGauge';
import SearchableSelect from './SearchableSelect';
import {
  OFFICIAL_UNIDADES,
  OFFICIAL_SERVICIOS,
  DEFAULT_PLACA,
  DEFAULT_SERVICIO,
  DEFAULT_UBICACION,
} from '../data/fleetData';

export default function CheckOut() {
  const navigate = useNavigate();
  const {
    vehicles,
    bitacora,
    registrarCheckOut,
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
    traccion: '4x4',
    empresaAsignada: 'VIP CAR Huancayo',
    odometroActual: 45345,
    nivelCombustible: 65,
  };

  const assignedVehicle =
    selectedVehicle ||
    (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) ||
    (vehicles && vehicles[0]) ||
    fallbackVehicle;

  const ultimoRegistro = (bitacora || []).find((b) => b?.placa === assignedVehicle?.placa);

  // Estados del formulario
  const [servicio, setServicio] = useState(selectedService || DEFAULT_SERVICIO);
  const [ubicacionManual, setUbicacionManual] = useState(currentUbicacion || DEFAULT_UBICACION);
  const [odometro, setOdometro] = useState((assignedVehicle?.odometroActual || 45300) + 45);
  const [combustible, setCombustible] = useState(65);
  const [novedades, setNovedades] = useState('');
  const [evaluacion, setEvaluacion] = useState('Óptimo');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoCompletadoMsg, setAutoCompletadoMsg] = useState(null);

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

  // Manejador del Selector de Flota Dinámico (30 unidades oficiales)
  const handleVehicleChange = (newPlaca) => {
    setSelectedVehiclePlaca(newPlaca);
    const target = (vehicles || []).find((v) => v?.placa === newPlaca);
    if (target) {
      const lastLog = (bitacora || []).find((b) => b?.placa === target?.placa);
      const baseOdo = lastLog?.odometro || target?.odometroActual || 45280;
      const odoEstimado = baseOdo + 45;
      const lastFuel = lastLog?.nivelCombustible
        ? parseInt(lastLog.nivelCombustible, 10)
        : (target?.nivelCombustible ?? 70);
      const combEstimado = Math.max(15, lastFuel - 15);
      setOdometro(odoEstimado);
      setCombustible(combEstimado);
      setAutoCompletadoMsg(`Unidad [${target?.placa || newPlaca}] asignada: Cierre sugerido ${odoEstimado.toLocaleString()} km • ${combEstimado}%`);
      setTimeout(() => setAutoCompletadoMsg(null), 3500);
    }
  };

  // Sincronizar odómetro al cambiar la placa asignada
  useEffect(() => {
    if (assignedVehicle?.odometroActual && !loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOdometro(assignedVehicle.odometroActual + 45);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedVehicle?.placa]);

  const kmRecorridos = Math.max(0, Number(odometro) - (assignedVehicle?.odometroActual || 0));

  // Autocompletar con cálculo estimado del turno
  const handleAutocompletar = () => {
    const baseOdo = ultimoRegistro?.odometro || assignedVehicle?.odometroActual || 45300;
    const odoEstimado = baseOdo + 45;
    const combEstimado = Math.max(
      15,
      (ultimoRegistro?.nivelCombustible ? parseInt(ultimoRegistro.nivelCombustible, 10) : 75) - 15
    );

    setOdometro(odoEstimado);
    setCombustible(combEstimado);
    setAutoCompletadoMsg(`Lectura sugerida calculada: ${odoEstimado.toLocaleString()} km • ${combEstimado}%`);
    setTimeout(() => setAutoCompletadoMsg(null), 3500);
  };

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

    // Persistir en contexto
    setCurrentUbicacion(targetUbicacion);
    setSelectedService(targetServicio);

    const resumenChecklist = `Cierre de Turno: ${evaluacion} (+${kmRecorridos} km)`;

    try {
      await registrarCheckOut({
        placa: targetPlaca,
        vehiculoId: assignedVehicle?.id,
        odometro: Number(odometro),
        odometroFinal: Number(odometro),
        combustible: Number(combustible),
        nivelCombustibleFinal: Number(combustible),
        novedades: novedades.trim(),
        evaluacion,
        kmRecorridos,
        conductor: currentDriver,
        servicio: targetServicio,
        ubicacion: targetUbicacion,
        latitud: gpsCoords?.latitud || null,
        longitud: gpsCoords?.longitud || null,
        precision: gpsCoords?.precision || null,
      });

      // Payload completo para Google Sheets (Requerimiento 4)
      const payloadWebhook = {
        'Fecha/Hora': fechaHoraActual,
        'Acción': 'Check-out',
        'Nombre del Conductor': currentDriver,
        'Placa seleccionada': targetPlaca,
        'Servicio seleccionado': targetServicio,
        'Ubicación escrita manualmente': targetUbicacion,
        'Kilometraje': Number(odometro),
        'Combustible (%)': `${combustible}%`,
        'Estado General': evaluacion,
        'Resumen del Checklist': resumenChecklist,
        'Observaciones': novedades.trim() || `Cierre de turno ${evaluacion}`,
        'Coordenadas GPS': gpsCoords ? `${gpsCoords.latitud}, ${gpsCoords.longitud}` : 'Sin GPS',

        // Claves técnicas para compatibilidad con paneles
        fechaHora: fechaHoraActual,
        tipoEvento: 'Check-out',
        accion: 'Check-out',
        conductor: currentDriver,
        operador: currentDriver,
        placa: targetPlaca,
        servicio: targetServicio,
        tipoServicio: targetServicio,
        ubicacion: targetUbicacion,
        odometro: Number(odometro),
        kilometraje: Number(odometro),
        combustible: Number(combustible),
        nivelCombustible: `${combustible}%`,
        checklist_condicion: evaluacion,
        estadoGeneral: evaluacion,
        resumenChecklist,
        kmRecorridos,
        observaciones: novedades.trim(),
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
      }, 1500);
    } catch (err) {
      console.error('Error al registrar Check-out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[#9c9c9d] pb-8">
      {/* Header con Conductor Activo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/conductor')}
          className="p-2 rounded-full telemetry-well border border-white/[0.08] text-[#9c9c9d] hover:text-[#ffffff] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 truncate">
          <h1 className="text-lg font-black text-[#ffffff] font-sans">Check-out de Turno</h1>
          <div className="flex items-center gap-2 text-[11px] text-[#6a6b6c] font-mono truncate">
            <span className="flex items-center gap-1 text-[#ff6363] truncate">
              <User className="w-3 h-3" />
              {currentDriver || 'Conductor no especificado'}
            </span>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-[#071f16] border border-[#59d499]/40 text-[#59d499] flex items-center gap-2.5 font-mono shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-[#59d499] shrink-0" />
          <div className="text-xs font-bold">
            ¡Turno cerrado con éxito! Kilómetros y consumo archivados en bitácora y Google Sheets.
          </div>
        </div>
      )}

      {/* Selectores de Placa y Tipo de Servicio (Requerimiento 1) */}
      <div className="cockpit-panel border border-white/[0.08] p-4 rounded-3xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            <Truck className="w-3.5 h-3.5 text-[#ff6363]" />
            <span>00 // Selector de Flota y Servicio</span>
          </div>
          <span className="text-[10px] font-mono text-[#59d499] bg-[#071f16] border border-[#59d499]/30 px-2 py-0.5 rounded-full font-bold">
            Oficial ({OFFICIAL_UNIDADES.length} Unidades)
          </span>
        </div>

        {/* Selector de Placa con buscador */}
        <SearchableSelect
          label="Unidad a Entregar (Placa)"
          options={OFFICIAL_UNIDADES}
          value={assignedVehicle?.placa || selectedVehiclePlaca}
          onChange={handleVehicleChange}
          placeholder="Buscar por placa o código (ej. BHF-821)..."
          icon={Truck}
        />

        {/* Selector de Tipo de Servicio con buscador */}
        <SearchableSelect
          label="Tipo de Servicio Realizado"
          options={OFFICIAL_SERVICIOS}
          value={servicio}
          onChange={(val) => {
            setServicio(val);
            setSelectedService(val);
          }}
          placeholder="Buscar tipo de servicio (ej. Aeropuerto, Almacén)..."
          icon={Briefcase}
        />

        {/* Tarjeta de Especificaciones de la Unidad Seleccionada */}
        <div className="w-full telemetry-well border border-white/[0.08] p-3.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="text-[10px] text-[#8e939e] uppercase font-mono font-bold">
              {assignedVehicle?.tipo || 'Camioneta'} • {assignedVehicle?.traccion || '4x4'}
            </div>
            <div className="text-sm font-black text-[#ffffff] font-sans truncate">
              {assignedVehicle?.marca || 'Toyota'} {assignedVehicle?.modelo || 'Hilux 4x4'}
            </div>
            <div className="text-[11px] text-cyan-400 font-mono">
              {assignedVehicle?.empresaAsignada || 'VIP CAR Huancayo'}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-mono font-black text-sm text-[#ff6363] px-3 py-1 rounded-full telemetry-well border border-[#ff6363]/50 tracking-wider shadow-sm">
              {assignedVehicle?.placa || DEFAULT_PLACA}
            </span>
            <span className="text-[10px] text-[#8e939e] font-mono mt-1">
              Base: {(assignedVehicle?.odometroActual ?? 0).toLocaleString()} km
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ubicación / Terminal en Texto Libre (Requerimiento 2: Sin botón de GPS) */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              01 // Ubicación de Entrega *
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
            placeholder="ej. Cochera Huancayo, Terminal El Tambo, Aeropuerto Jauja..."
            className="w-full telemetry-well border border-white/[0.1] rounded-2xl px-4 py-3 text-xs font-mono font-semibold text-[#ffffff] placeholder-[#6a6b6c] focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Odómetro final con Botón Autocompletar */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#ff6363]" />
              02 // Odómetro Final (km) *
            </label>

            {/* Botón de Autocompletado Rápido */}
            <button
              type="button"
              onClick={handleAutocompletar}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              title="Cargar cálculo estimado del turno"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autocompletar lectura sugerida</span>
            </button>
          </div>

          {autoCompletadoMsg && (
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 animate-in fade-in">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>{autoCompletadoMsg}</span>
            </div>
          )}

          <div className="text-[10px] text-[#6a6b6c] font-mono">
            Odómetro inicial de turno: {(assignedVehicle?.odometroActual ?? 0).toLocaleString()} km
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              required
              min={assignedVehicle?.odometroActual || 0}
              value={odometro}
              onChange={(e) => setOdometro(e.target.value)}
              className="w-full telemetry-well border border-white/[0.1] rounded-full px-4 py-3 text-2xl font-mono font-black text-[#ffffff] text-center tracking-widest focus:outline-none focus:border-[#ff6363]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6a6b6c] font-bold font-mono">
              KM
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono p-2.5 telemetry-well rounded-2xl border border-white/[0.08]">
            <span className="text-[#6a6b6c]">Recorrido del Turno:</span>
            <span className="text-white font-bold">{kmRecorridos} km</span>
          </div>
        </div>

        {/* Nivel de Combustible al Cierre */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-[#59d499]" />
              03 // Combustible de Entrega *
            </label>
            <span className="font-mono text-xs text-[#59d499] font-bold">{combustible}%</span>
          </div>

          <FuelGauge
            value={combustible}
            onChange={(val) => setCombustible(val)}
            label="Nivel de Combustible Final"
          />
        </div>

        {/* Evaluación del Vehículo */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            04 // Estado Mecánico de Entrega *
          </label>
          <div className="grid grid-cols-3 gap-2 font-mono">
            {['Óptimo', 'Regular', 'Requiere mantenimiento'].map((cond) => (
              <button
                type="button"
                key={cond}
                onClick={() => setEvaluacion(cond)}
                className={`p-2.5 rounded-full text-xs font-bold transition-all text-center cursor-pointer ${
                  evaluacion === cond
                    ? cond === 'Requiere mantenimiento'
                      ? 'bg-[#ff6363] text-white font-bold'
                      : 'btn-cockpit-action text-white font-bold'
                    : 'telemetry-well text-[#9c9c9d] border border-white/[0.08] hover:border-white/[0.2]'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Novedades */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-1.5">
          <label className="text-xs font-mono font-bold text-[#6a6b6c] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#6a6b6c]" />
            05 // Novedades del Turno
          </label>
          <textarea
            rows={2}
            value={novedades}
            onChange={(e) => setNovedades(e.target.value)}
            placeholder="Reporte de barro en carretera, desvío por obras o ruidos mecánicos..."
            className="w-full telemetry-well border border-white/[0.08] rounded-2xl p-2.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#ff6363] font-mono placeholder-[#6a6b6c]"
          />
        </div>

        {/* Botón de Cierre Cockpit Action - Sticky */}
        <button
          type="submit"
          disabled={loading || success}
          className="btn-cockpit-action w-full py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wide rounded-full font-mono font-bold active:scale-98 disabled:opacity-50 cursor-pointer shadow-2xl sticky bottom-4 z-10 backdrop-blur-md"
        >
          <ClipboardX className="w-4 h-4 stroke-[2.5]" />
          <span>
            {loading ? 'SINCRONIZANDO EN FIRESTORE Y SHEETS...' : 'CERRAR Y REGISTRAR TURNO'}
          </span>
        </button>
      </form>
    </div>
  );
}
