import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from './FleetContext';
import {
  AlertOctagon,
  Camera,
  ArrowLeft,
  Truck,
  Phone,
  CheckCircle2,
  Upload,
  User,
  AlertTriangle
} from 'lucide-react';

export default function ReportarAveria() {
  const navigate = useNavigate();
  const {
    vehicles,
    reportarAveriaEmergencia,
    currentDriver,
    currentTerminal,
    terminalCoordinates,
    selectedVehiclePlaca,
    setSelectedVehiclePlaca,
    selectedVehicle,
  } = useFleet();

  const assignedVehicle = selectedVehicle || vehicles.find((v) => v.placa === selectedVehiclePlaca) || vehicles[0];

  const [tipoFalla, setTipoFalla] = useState('Falla mecánica');
  const [severidad, setSeveridad] = useState('Grave');
  const [descripcion, setDescripcion] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [errorGps, setErrorGps] = useState(null);

  // Estados para validación y badge de GPS con soporte de respaldo
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'loading' | 'active' | 'denied' | 'fallback'
  const [gpsCoords, setGpsCoords] = useState(null);

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

  // Función de respaldo para zonas sin cobertura satelital
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    validarGPS();
  }, []);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
            (position) => {
              resolve({
                latitud: position.coords.latitude,
                longitud: position.coords.longitude,
                precision: Math.round(position.coords.accuracy),
                timestamp: position.timestamp,
              });
            },
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
        setGpsCoords(coords);
        setGpsStatus('active');
      } catch {
        setErrorGps('Debes activar la ubicación o seleccionar la ubicación de respaldo para emitir la alerta SOS.');
        setGpsStatus('denied');
        setObteniendoUbicacion(false);
        return;
      }
      setObteniendoUbicacion(false);
    }

    setLoading(true);

    try {
      await reportarAveriaEmergencia({
        placa: assignedVehicle.placa,
        vehiculoId: assignedVehicle.id,
        tipoFalla,
        severidad,
        descripcion: descripcion.trim(),
        conductor: currentDriver,
        operacion: currentTerminal,
        foto: fotoPreview,
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
            tipoEvento: 'SOS',
            operador: currentDriver,
            placa: assignedVehicle.placa,
            odometro: Number(assignedVehicle.odometroActual || 14750),
            combustible: Number(assignedVehicle.nivelCombustible || 75),
            checklist_condicion: `${tipoFalla} [${severidad}]`,
            observaciones: descripcion.trim(),
            tipoFalla,
            severidad,
            latitud: coords.latitud,
            longitud: coords.longitud,
          }),
        });
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
    <div className="space-y-4 text-[#9c9c9d]">
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
            <AlertOctagon className="w-5 h-5 animate-pulse" />
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
        <div className="p-3.5 rounded-full bg-[#ff6363] text-white flex items-center gap-3 shadow-lg font-mono">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs font-bold">
            ¡ALERTA TRANSMITIDA! Supervisión de flota y auxilio mecánico han sido notificados.
          </div>
        </div>
      )}

      {/* Indicador Visual de Geolocalización (Badge de Validación y Respaldo) */}
      {gpsStatus === 'active' && gpsCoords && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 flex items-center justify-between text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <div className="font-bold">GPS SOS Activo // Ubicación Precisa</div>
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
            Puedes reintentar la conexión o activar el respaldo oficial para <strong className="text-white">{currentTerminal}</strong> para poder emitir el reporte SOS.
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

      {/* Unidad Afectada (Selector Dinámico) */}
      <div className="cockpit-panel border border-[#ff6363]/40 p-4 rounded-3xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#ff6363]" />
            <div className="text-[10px] text-[#ff6363] uppercase font-mono font-bold">Unidad Afectada // SOS</div>
          </div>
          <span className="font-mono font-bold text-xs text-[#ff6363] px-2.5 py-0.5 rounded-full telemetry-well border border-[#ff6363]/40">
            {assignedVehicle.placa}
          </span>
        </div>

        <div className="relative">
          <select
            value={assignedVehicle.placa}
            onChange={(e) => setSelectedVehiclePlaca(e.target.value)}
            className="w-full bg-[#0a0c0e] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-[#ffffff] font-mono font-semibold focus:outline-none focus:border-[#ff6363] cursor-pointer appearance-none"
          >
            {vehicles.map((v, idx) => (
              <option key={v.id || v.placa} value={v.placa} className="bg-[#0e1115] text-[#ffffff]">
                #{String(idx + 1).padStart(2, '0')} • [{v.placa}] {v.marca} {v.modelo}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6a6b6c]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="w-full text-[11px] text-slate-300 font-mono whitespace-normal leading-snug pt-0.5">
          {assignedVehicle.marca} {assignedVehicle.modelo} ({assignedVehicle.tipo}) • {assignedVehicle.empresaAsignada}
        </div>
      </div>

      {/* Teléfono de Asistencia */}
      <div className="p-3 telemetry-well border border-white/[0.08] rounded-full flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#6a6b6c]">
          <Phone className="w-3.5 h-3.5 text-[#ff6363]" />
          <span className="text-[11px] font-mono">Auxilio Mecánico Junín 24/7:</span>
        </div>
        <a
          href="tel:954123456"
          className="text-xs font-bold text-[#ff6363] hover:underline font-mono"
        >
          954 123 456
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de falla */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c]">
            01 // Tipo de Falla o Incidente *
          </label>
          <select
            value={tipoFalla}
            onChange={(e) => setTipoFalla(e.target.value)}
            className="w-full telemetry-well border border-white/[0.08] rounded-full p-2.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#ff6363] font-mono cursor-pointer"
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
            02 // Nivel de Severidad *
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
                className={`p-2.5 rounded-full border text-center transition-all cursor-pointer ${
                  severidad === sev.id
                    ? 'bg-[#ff6363] text-white font-bold border-[#ff6363] shadow-xs'
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
            03 // Detalle de la Avería *
          </label>
          <textarea
            required
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa el ruido, rotura, impacto o motivo del paro..."
            className="w-full telemetry-well border border-white/[0.08] rounded-2xl p-2 text-xs text-[#ffffff] focus:outline-none focus:border-[#ff6363] font-mono"
          />
        </div>

        {/* Foto de Evidencia */}
        <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#ff6363]" />
            04 // Foto de Evidencia
          </label>

          <label className="cursor-pointer flex flex-col items-center justify-center p-4 border border-dashed border-white/[0.15] hover:border-white/[0.3] rounded-3xl telemetry-well transition-colors">
            {fotoPreview ? (
              <div className="space-y-1.5 text-center">
                <img
                  src={fotoPreview}
                  alt="Evidencia"
                  className="max-h-36 rounded-2xl mx-auto object-cover border border-white/[0.1]"
                />
                <span className="text-[10px] text-[#ff6363] font-mono font-bold">Cambiar foto</span>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full telemetry-well border border-white/[0.1] text-[#9c9c9d] flex items-center justify-center mx-auto">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#ffffff]">Tomar foto o subir archivo</div>
                <div className="text-[10px] text-[#6a6b6c] font-mono">JPG, PNG directa de cámara</div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Alerta de Error de GPS */}
        {errorGps && gpsStatus !== 'fallback' && (
          <div className="p-4 rounded-2xl bg-[#2d0e14] border border-[#ff6363] text-[#ff6363] flex items-start gap-3 text-xs font-mono animate-in fade-in">
            <AlertOctagon className="w-5 h-5 shrink-0 text-[#ff6363] mt-0.5" />
            <div>
              <strong className="block text-white font-bold mb-0.5">Ubicación Requerida</strong>
              <span>{errorGps}</span>
            </div>
          </div>
        )}

        {/* Botón de Emergencia Rojo Racing */}
        <button
          type="submit"
          disabled={loading || obteniendoUbicacion || success}
          className="w-full py-4 rounded-full bg-[#ff6363] hover:bg-[#e11d48] text-white font-black text-sm shadow-lg transition-colors flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer font-mono"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>
            {obteniendoUbicacion
              ? 'Obteniendo ubicación...'
              : loading
              ? 'TRANSMITIENDO ALERTA SOS...'
              : 'ENVIAR REPORTE DE EMERGENCIA'}
          </span>
        </button>
      </form>
    </div>
  );
}
