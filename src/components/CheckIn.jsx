import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from './FleetContext';
import {
  ClipboardCheck,
  Gauge,
  Fuel,
  Check,
  AlertTriangle,
  ArrowLeft,
  Truck,
  WifiOff,
  CloudUpload,
  Radio,
  Zap,
  User
} from 'lucide-react';
import SemaforoBadge from './SemaforoBadge';
import FuelGauge from './FuelGauge';

const PREOPERATIONAL_ITEMS = [
  { id: 'luces', label: 'Luces frontales, posteriores y direccionales', obligatorio: true },
  { id: 'circulina', label: 'Circulina ámbar y pértiga LED operativa', obligatorio: true },
  { id: 'frenos', label: 'Frenos de servicio y freno de mano', obligatorio: true },
  { id: 'neumaticos', label: 'Neumáticos (presión y cocada adecuada)', obligatorio: true },
  { id: 'aceite', label: 'Nivel de aceite de motor y refrigerante', obligatorio: true },
  { id: 'seguridad', label: 'Extintor vigente (PQS 6kg) y botiquín minero', obligatorio: true },
  { id: 'tacos', label: '2 Tacos de seguridad y llanta de repuesto', obligatorio: true },
  { id: 'jaula', label: 'Jaula antivuelco interna/externa sin fisuras', obligatorio: true },
];

export default function CheckIn() {
  const navigate = useNavigate();
  const {
    vehicles,
    bitacora,
    registrarCheckIn,
    currentDriver,
    currentTerminal,
    terminalCoordinates,
    selectedVehiclePlaca,
    setSelectedVehiclePlaca,
    selectedVehicle,
  } = useFleet();

  const fallbackVehicle = {
    placa: 'W4E-892',
    marca: 'Toyota',
    modelo: 'Hilux 4x4',
    tipo: 'Camioneta Pick-up',
    traccion: '4x4',
    empresaAsignada: 'VIP CAR Huancayo',
    odometroActual: 14750,
    nivelCombustible: 75,
  };
  const assignedVehicle = selectedVehicle || (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) || (vehicles && vehicles[0]) || fallbackVehicle;
  const ultimoRegistro = (bitacora || []).find((b) => b?.placa === assignedVehicle?.placa);

  const [odometro, setOdometro] = useState(assignedVehicle?.odometroActual || 14750);
  const [combustible, setCombustible] = useState(assignedVehicle?.nivelCombustible || 75);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    luces: true,
    circulina: true,
    frenos: true,
    neumaticos: true,
    aceite: true,
    seguridad: true,
    tacos: true,
    jaula: true,
  });
  const [success, setSuccess] = useState(false);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [errorGps, setErrorGps] = useState(null);
  const [autoCompletadoMsg, setAutoCompletadoMsg] = useState(null);

  // Manejador del Selector de Flota Dinámico
  const handleVehicleChange = (newPlaca) => {
    setSelectedVehiclePlaca(newPlaca);
    const target = (vehicles || []).find((v) => v?.placa === newPlaca);
    if (target) {
      const lastLog = (bitacora || []).find((b) => b?.placa === target?.placa);
      const targetOdo = lastLog?.odometro || target?.odometroActual || 0;
      const targetFuel = lastLog?.nivelCombustible
        ? parseInt(lastLog.nivelCombustible, 10)
        : (target?.nivelCombustible ?? 75);
      setOdometro(targetOdo);
      setCombustible(targetFuel);
      setAutoCompletadoMsg(`Unidad [${target?.placa || newPlaca}] asignada: ${targetOdo.toLocaleString()} km • ${targetFuel}%`);
      setTimeout(() => setAutoCompletadoMsg(null), 3500);
    }
  };

  // Estados para validación y badge de GPS con soporte de respaldo
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'loading' | 'active' | 'denied' | 'fallback'
  const [gpsCoords, setGpsCoords] = useState(null);

  // Sincronizar si el vehículo se actualiza desde Firestore
  useEffect(() => {
    if (assignedVehicle?.odometroActual && !loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOdometro(assignedVehicle.odometroActual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedVehicle?.placa, assignedVehicle?.odometroActual]);

  // Validar GPS satelital
  const validarGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      setErrorGps('Geolocalización no soportada por el navegador.');
      return;
    }
    setGpsStatus('loading');
    setErrorGps(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
        };
        setGpsCoords(coords);
        setGpsStatus('active');
        setErrorGps(null);
      },
      () => {
        setGpsStatus('denied');
        setErrorGps('El navegador denegó o no pudo acceder al sensor GPS.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Función de respaldo por si el navegador o socavón deniegan el GPS
  const usarUbicacionRespaldo = () => {
    const termCoords = terminalCoordinates[currentTerminal] || { latitud: -12.0651, longitud: -75.2049 };
    const fallbackCoords = {
      latitud: termCoords.latitud,
      longitud: termCoords.longitud,
      precision: 50,
      esRespaldo: true,
      timestamp: Date.now(),
    };
    setGpsCoords(fallbackCoords);
    setGpsStatus('fallback');
    setErrorGps(null);
  };

  // Intentar validar GPS automáticamente al abrir
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    validarGPS();
  }, []);

  // Función para autocompletar con el último registro
  const handleAutocompletar = () => {
    const odo = ultimoRegistro?.odometro || assignedVehicle?.odometroActual || 14750;
    const comb = ultimoRegistro?.nivelCombustible
      ? parseInt(ultimoRegistro.nivelCombustible, 10)
      : (assignedVehicle?.nivelCombustible || 75);

    setOdometro(odo);
    setCombustible(comb);
    setAutoCompletadoMsg(`Valores cargados de bitácora: ${odo.toLocaleString()} km • ${comb}%`);
    setTimeout(() => setAutoCompletadoMsg(null), 3500);
  };

  const toggleCheck = (id) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const [isOfflineRecord, setIsOfflineRecord] = useState(false);
  const [modoOdometro, setModoOdometro] = useState('manual');
  const [calculandoGPS, setCalculandoGPS] = useState(false);

  const handleCalcularGPS = () => {
    setCalculandoGPS(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          validarGPS();
          setCalculandoGPS(false);
        },
        () => {
          setCalculandoGPS(false);
        },
        { timeout: 4000 }
      );
    } else {
      setCalculandoGPS(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si aún no hay coordenadas, intentar obtenerlas
    let coords = gpsCoords;
    if (!coords) {
      setErrorGps(null);
      setObteniendoUbicacion(true);
      try {
        coords = await new Promise((resolve, reject) => {
          if (!('geolocation' in navigator)) {
            reject(new Error('Geolocalización no soportada por el navegador.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitud: pos.coords.latitude,
                longitud: pos.coords.longitude,
                precision: Math.round(pos.coords.accuracy),
                timestamp: pos.timestamp,
              });
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
        setGpsCoords(coords);
        setGpsStatus('active');
      } catch {
        setErrorGps('Debes activar la ubicación o seleccionar la ubicación de respaldo para registrar el turno.');
        setGpsStatus('denied');
        setObteniendoUbicacion(false);
        return;
      }
      setObteniendoUbicacion(false);
    }

    setLoading(true);

    try {
      const res = await registrarCheckIn({
        placa: assignedVehicle.placa,
        vehiculoId: assignedVehicle.id,
        odometro: Number(odometro),
        combustible: Number(combustible),
        checklist: allChecked,
        conductor: currentDriver,
        observaciones: observaciones.trim(),
        operacion: currentTerminal,
        ubicacion: coords,
        latitud: coords.latitud,
        longitud: coords.longitud,
        precision: coords.precision,
      });

      // Envío al Webhook de Google Sheets
      try {
        await fetch('https://script.google.com/macros/s/AKfycbz2tPas7ur3GYyWcKEPG9KaRI8QWzoV0-8xY9zuCCGK7j3Ht6M5ZFjuJA-ZP4shy5zTuQ/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            tipoEvento: 'Check-in',
            operador: currentDriver,
            placa: assignedVehicle.placa,
            odometro: Number(odometro),
            combustible: Number(combustible),
            checklist_condicion: allChecked ? 'Conforme / Aprobado' : 'Con observaciones',
            observaciones: observaciones.trim(),
            latitud: coords.latitud,
            longitud: coords.longitud,
          }),
        });
      } catch (webhookErr) {
        console.warn('Error al enviar al Webhook de Google Sheets:', webhookErr);
      }

      setIsOfflineRecord(Boolean(!navigator.onLine || res?.guardadoEnSocavon));
      setSuccess(true);
      setTimeout(() => {
        navigate('/conductor');
      }, 1600);
    } catch (err) {
      console.error('Error al guardar Check-in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[#9c9c9d]">
      {/* Header con Conductor Activo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/conductor')}
          className="p-2 rounded-[10px] telemetry-well border border-white/[0.08] text-[#9c9c9d] hover:text-[#ffffff] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 truncate">
          <h1 className="text-lg font-black text-[#ffffff] font-sans">Check-in de Turno</h1>
          <div className="flex items-center gap-2 text-[11px] text-[#6a6b6c] font-mono truncate">
            <span className="flex items-center gap-1 text-[#ff6363] truncate">
              <User className="w-3 h-3" />
              {currentDriver || 'Conductor no especificado'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Operación en Socavón (Offline) */}
      {!navigator.onLine && (
        <div className="p-3 rounded-[10px] bg-[#231908] border border-[#f59e0b]/40 text-[#f59e0b] flex items-center gap-2 text-xs font-mono">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            <strong>Modo Socavón (Sin Señal 4G):</strong> Tu registro se guardará localmente en el dispositivo y se sincronizará automáticamente.
          </span>
        </div>
      )}

      {success && (
        <div className={`p-3.5 rounded-[10px] border flex items-center gap-2.5 ${
          isOfflineRecord
            ? 'bg-[#231908] border-[#f59e0b]/50 text-[#f59e0b]'
            : 'bg-[#071f16] border-[#59d499]/40 text-[#59d499]'
        }`}>
          {isOfflineRecord ? (
            <CloudUpload className="w-5 h-5 text-[#f59e0b] shrink-0 animate-bounce" />
          ) : (
            <ClipboardCheck className="w-5 h-5 text-[#59d499] shrink-0" />
          )}
          <div className="text-xs font-bold font-mono">
            {isOfflineRecord
              ? `¡Check-in guardado en Socavón! Unidad [${assignedVehicle.placa}] guardada localmente.`
              : `¡Check-in registrado! Odómetro y telemetría de [${assignedVehicle.placa}] sincronizados.`}
          </div>
        </div>
      )}

      {/* Indicador Visual de Geolocalización (Badge de Validación y Respaldo) */}
      {gpsStatus === 'active' && gpsCoords && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 flex items-center justify-between text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <div className="font-bold flex items-center gap-1">
                <span>GPS Activo // Coordenadas Validadas</span>
              </div>
              <div className="text-[11px] text-emerald-300/80">
                {gpsCoords.latitud.toFixed(4)}°, {gpsCoords.longitud.toFixed(4)}° • Precisión ±{gpsCoords.precision || 10}m
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={validarGPS}
            className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-white text-[10px] font-bold border border-emerald-500/40 cursor-pointer"
          >
            Actualizar
          </button>
        </div>
      )}

      {gpsStatus === 'fallback' && gpsCoords && (
        <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-amber-400 flex items-center justify-between text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <div>
              <div className="font-bold">Ubicación de Respaldo ({currentTerminal})</div>
              <div className="text-[11px] text-amber-300/80">
                {gpsCoords.latitud.toFixed(4)}°, {gpsCoords.longitud.toFixed(4)}° • Cobertura contingencia
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={validarGPS}
            className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-white text-[10px] font-bold border border-amber-500/40 cursor-pointer"
          >
            Reintentar GPS
          </button>
        </div>
      )}

      {gpsStatus === 'denied' && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-mono space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Permiso GPS denegado o satélite sin cobertura</span>
          </div>
          <p className="text-[11px] text-rose-200/80">
            Puedes reintentar la conexión o activar el respaldo oficial para <strong className="text-white">{currentTerminal}</strong> para poder enviar el formulario.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={validarGPS}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/20 font-bold cursor-pointer"
            >
              Reintentar GPS
            </button>
            <button
              type="button"
              onClick={usarUbicacionRespaldo}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold border border-amber-400 cursor-pointer shadow-md"
            >
              ▲ Activar Respaldo ({currentTerminal})
            </button>
          </div>
        </div>
      )}

      {/* Selector de Flota Dinámico (18 Unidades vipcarhuancayo.com) */}
      <div className="cockpit-panel border border-white/[0.08] p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            <Truck className="w-3.5 h-3.5 text-[#ff6363]" />
            <span>00 // Selector de Flota Dinámico</span>
          </div>
          <span className="text-[10px] font-mono text-[#59d499] bg-[#071f16] border border-[#59d499]/30 px-2 py-0.5 rounded-full font-bold">
            vipcarhuancayo.com ({vehicles.length} Unidades)
          </span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="select-flota-checkin" className="text-[11px] text-[#9c9c9d] font-mono">
            Vehículo de turno:
          </label>
          <div className="relative">
            <select
              id="select-flota-checkin"
              value={assignedVehicle?.placa || ''}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full bg-[#0a0c0e] border border-white/[0.15] rounded-2xl px-3.5 py-3 text-xs text-[#ffffff] font-mono font-semibold focus:outline-none focus:border-[#ff6363] transition-colors cursor-pointer appearance-none"
            >
              {(vehicles || []).map((v, idx) => (
                <option key={v.id || v.placa} value={v.placa} className="bg-[#0e1115] text-[#ffffff] py-2">
                  #{String(idx + 1).padStart(2, '0')} • [{v.placa}] {v.marca} {v.modelo} ({v.tipo})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#6a6b6c]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tarjeta de Especificaciones de la Unidad Seleccionada */}
        <div className="w-full telemetry-well border border-white/[0.08] p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-[10px] text-[#8e939e] uppercase font-mono font-bold">
              {assignedVehicle?.tipo || 'Pickup 4x4'} • {assignedVehicle?.traccion || '4x4'}
            </div>
            <div className="text-sm sm:text-base font-black text-[#ffffff] font-sans whitespace-normal leading-snug">
              {assignedVehicle?.marca || 'Toyota'} {assignedVehicle?.modelo || 'Hilux 4x4'}
            </div>
            <div className="text-[11px] text-cyan-400 font-mono">
              {assignedVehicle?.empresaAsignada || 'VIP CAR Huancayo'}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="font-mono font-black text-sm sm:text-base text-[#ff6363] px-3.5 py-1 rounded-full telemetry-well border border-[#ff6363]/50 tracking-wider shadow-md">
              {assignedVehicle?.placa || 'W4E-892'}
            </span>
            <span className="text-[10px] text-[#8e939e] font-mono mt-1">
              Base: {(assignedVehicle?.odometroActual ?? 0).toLocaleString()} km
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Odómetro Sunken con Monospace Blanco y Botón Autocompletar */}
        <div className="cockpit-panel border border-white/[0.08] p-5 rounded-3xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#ff6363]" />
              01 // Registro de Odómetro (km) *
            </label>

            {/* Botón de Autocompletado Rápido con Último Registro */}
            <button
              type="button"
              onClick={handleAutocompletar}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              title="Cargar odómetro y combustible del último turno"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autocompletar ({ultimoRegistro?.odometro || assignedVehicle.odometroActual} km)</span>
            </button>
          </div>

          {autoCompletadoMsg && (
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 animate-in fade-in">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>{autoCompletadoMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-[#6a6b6c] font-mono">
            <span>Último registrado en flota: {assignedVehicle.odometroActual} km</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setModoOdometro(modoOdometro === 'manual' ? 'gps' : 'manual')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                {modoOdometro === 'manual' ? 'Modo GPS' : 'Modo Manual'}
              </button>
            </div>
          </div>

          {/* Panel informativo de cálculo por GPS */}
          {modoOdometro === 'gps' && (
            <div className="p-3 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-between text-xs font-mono text-[#38bdf8]">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#38bdf8] shrink-0" />
                <span className="text-[11px] font-medium">
                  {calculandoGPS ? 'Calculando recorrido por satélites...' : 'Geolocalización satelital activa'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCalcularGPS}
                disabled={calculandoGPS}
                className="text-[10px] underline font-bold hover:text-white cursor-pointer shrink-0 ml-2"
              >
                Recalcular
              </button>
            </div>
          )}

          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              required
              min={assignedVehicle.odometroActual}
              value={odometro}
              onChange={(e) => setOdometro(e.target.value)}
              className="w-full telemetry-well border border-white/[0.1] rounded-full px-4 py-3 text-2xl font-mono font-black text-[#ffffff] text-center tracking-widest focus:outline-none focus:border-[#ff6363]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6a6b6c] font-bold font-mono">
              KM
            </span>
          </div>

          {/* Semáforo en vivo */}
          <div className="mt-1">
            <SemaforoBadge odometro={Number(odometro) || assignedVehicle.odometroActual} />
          </div>
        </div>

        {/* Nivel de Combustible con Tacómetro Visual */}
        <div className="cockpit-panel border border-white/[0.08] p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-[#59d499]" />
              02 // Nivel de Combustible *
            </label>
            <span className="font-mono text-xs text-[#59d499] font-bold">{combustible}%</span>
          </div>

          <FuelGauge
            value={combustible}
            onChange={(val) => setCombustible(val)}
            label="Nivel de Combustible"
          />
        </div>

        {/* Checklist Preoperacional */}
        <div className="cockpit-panel border border-white/[0.08] p-5 rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-[#ff6363]" />
              03 // Inspección de Seguridad
            </label>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              allChecked
                ? 'bg-[#59d499]/15 text-[#59d499] border border-[#59d499]/40'
                : 'bg-[#ff6363]/15 text-[#ff6363] border border-[#ff6363]/40'
            }`}>
              {allChecked ? '100% CONFORME' : 'CON OBSERVACIONES'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {(PREOPERATIONAL_ITEMS || []).map((item) => {
              const isChecked = checklist[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer select-none ${
                    isChecked
                      ? 'telemetry-well border-white/[0.08] hover:border-white/[0.2]'
                      : 'bg-[#2d0e14]/40 border-[#ff6363]/40'
                  }`}
                >
                  <span className={`text-xs font-mono ${isChecked ? 'text-white' : 'text-[#ff6363]'}`}>
                    {item.label}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-[#59d499] text-black font-bold'
                        : 'bg-[#07080a] border border-[#ff6363] text-[#ff6363]'
                    }`}
                  >
                    {isChecked ? <Check className="w-3 h-3 stroke-[3]" /> : <AlertTriangle className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Observaciones */}
        <div className="cockpit-panel border border-white/[0.08] p-5 rounded-3xl space-y-1.5">
          <label className="text-xs font-mono font-bold text-[#6a6b6c]">
            Observaciones Adicionales
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Reporte de barro, presión de llantas u observaciones de ingreso..."
            className="w-full telemetry-well border border-white/[0.08] rounded-2xl p-3 text-xs text-[#ffffff] focus:outline-none focus:border-[#ff6363] font-mono"
          />
        </div>

        {/* Alerta de Error de GPS si falló */}
        {errorGps && gpsStatus !== 'fallback' && (
          <div className="p-4 rounded-2xl bg-[#2d0e14] border border-[#ff6363] text-[#ff6363] flex items-start gap-3 text-xs font-mono animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#ff6363] mt-0.5" />
            <div>
              <strong className="block text-white font-bold mb-0.5">Ubicación Requerida</strong>
              <span>{errorGps}</span>
            </div>
          </div>
        )}

        {/* Botón Cockpit Action Cápsula - Sticky */}
        <button
          type="submit"
          disabled={loading || obteniendoUbicacion || success}
          className="btn-cockpit-action w-full py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wide rounded-full font-mono font-bold active:scale-98 disabled:opacity-50 cursor-pointer shadow-2xl sticky bottom-4 z-10 backdrop-blur-md"
        >
          <ClipboardCheck className="w-4 h-4 stroke-[2.5]" />
          <span>
            {obteniendoUbicacion
              ? 'Obteniendo ubicación...'
              : loading
              ? 'SINCRONIZANDO EN FIRESTORE...'
              : 'CONFIRMAR CHECK-IN DE TURNO'}
          </span>
        </button>
      </form>
    </div>
  );
}
