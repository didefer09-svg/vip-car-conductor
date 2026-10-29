import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from './FleetContext';
import SearchableSelect from './SearchableSelect';
import {
  CHECKLIST_CATEGORIAS,
  CHECKLIST_43_ITEMS,
} from '../data/fleetData';
import {
  ClipboardCheck,
  Gauge,
  Fuel,
  Check,
  AlertTriangle,
  ArrowLeft,
  Truck,
  User,
  MapPin,
  Briefcase,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Zap
} from 'lucide-react';
import SemaforoBadge from './SemaforoBadge';
import FuelGauge from './FuelGauge';

export default function CheckIn() {
  const navigate = useNavigate();
  const {
    vehicles,
    unidades,
    servicios,
    bitacora,
    registrarCheckIn,
    currentDriver,
    currentUbicacion,
    setCurrentUbicacion,
    selectedVehiclePlaca,
    setSelectedVehiclePlaca,
    selectedService,
    setSelectedService,
    selectedVehicle,
  } = useFleet();

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
  };

  const assignedVehicle =
    selectedVehicle ||
    (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) ||
    (vehicles && vehicles[0]) ||
    fallbackVehicle;

  // Último registro de bitácora para autocompletar
  const ultimoRegistro = (bitacora || []).find((b) => b?.placa === assignedVehicle?.placa);

  // Estados del Formulario
  const [servicio, setServicio] = useState(selectedService);
  const [ubicacionManual, setUbicacionManual] = useState(currentUbicacion || 'Cochera Huancayo');
  const [odometro, setOdometro] = useState(assignedVehicle?.odometroActual || 45280);
  const [combustible, setCombustible] = useState(assignedVehicle?.nivelCombustible || 80);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isOfflineRecord, setIsOfflineRecord] = useState(false);
  const [autoCompletadoMsg, setAutoCompletadoMsg] = useState(null);

  // Coordenadas GPS silenciosas en segundo plano (Requerimiento 2: SIN botón visible de actualizar GPS)
  const [gpsCoords, setGpsCoords] = useState(null);

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
          // Si no hay permiso o falla, no se muestra ningún error intrusivo
          setGpsCoords(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Inicialización del Checklist Oficial de 43 Puntos (Todos true/conformes por defecto)
  const initialChecklist = useMemo(() => {
    const init = {};
    (CHECKLIST_43_ITEMS || []).forEach((item) => {
      init[item.id] = true;
    });
    return init;
  }, []);

  const [checklist, setChecklist] = useState(initialChecklist);

  // Estado para acordeones de categorías (abiertos por defecto o toggle)
  const [categoriasAbiertas, setCategoriasAbiertas] = useState({
    fuera_vehiculo: true,
    neumaticos: false,
    motor: false,
    interior_apagado: false,
    accesorios_documentos: false,
    energizado_luces_exterior: false,
    energizado_interior: false,
  });

  const toggleCategoria = (catId) => {
    setCategoriasAbiertas((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const toggleCheck = (itemId) => {
    setChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const marcarTodosConformes = () => {
    setChecklist(initialChecklist);
  };

  // Cálculo del resumen de 43 puntos
  const totalItems = CHECKLIST_43_ITEMS.length; // 43
  const conformesCount = useMemo(() => {
    return (CHECKLIST_43_ITEMS || []).filter((it) => checklist[it.id]).length;
  }, [checklist]);

  const itemsConFalla = useMemo(() => {
    return (CHECKLIST_43_ITEMS || []).filter((it) => !checklist[it.id]);
  }, [checklist]);

  const allChecked = conformesCount === totalItems;

  const resumenChecklist = useMemo(() => {
    if (allChecked) {
      return '43/43 OK';
    }
    const fallasTexto = itemsConFalla.map((it) => `#${it.num} ${it.label}`).join(', ');
    return `${conformesCount}/43 OK - Fallas: ${fallasTexto}`;
  }, [allChecked, conformesCount, itemsConFalla]);

  const estadoGeneral = allChecked ? 'Conforme / Operativo' : 'Con Observaciones';

  // Manejador del Selector de Flota Dinámico
  const handleVehicleChange = (newPlaca) => {
    setSelectedVehiclePlaca(newPlaca);
    const target = (vehicles || []).find((v) => v?.placa === newPlaca);
    if (target) {
      const lastLog = (bitacora || []).find((b) => b?.placa === target?.placa);
      const targetOdo = lastLog?.odometro || target?.odometroActual || 45280;
      const targetFuel = lastLog?.nivelCombustible
        ? parseInt(lastLog.nivelCombustible, 10)
        : (target?.nivelCombustible ?? 80);
      setOdometro(targetOdo);
      setCombustible(targetFuel);
      setAutoCompletadoMsg(`Unidad [${target?.placa || newPlaca}] seleccionada: ${targetOdo.toLocaleString()} km • ${targetFuel}%`);
      setTimeout(() => setAutoCompletadoMsg(null), 3500);
    }
  };

  const handleAutocompletarUltimo = () => {
    if (ultimoRegistro) {
      const odo = Number(ultimoRegistro.odometro || ultimoRegistro.kilometraje) || assignedVehicle?.odometroActual || 45280;
      const comb = parseInt(ultimoRegistro.nivelCombustible || ultimoRegistro.combustible, 10) || assignedVehicle?.nivelCombustible || 80;
      setOdometro(odo);
      setCombustible(comb);
      setAutoCompletadoMsg(`Autocompletado con último registro: ${odo.toLocaleString()} km • ${comb}%`);
      setTimeout(() => setAutoCompletadoMsg(null), 3500);
    } else {
      setOdometro(assignedVehicle?.odometroActual || 45280);
      setCombustible(assignedVehicle?.nivelCombustible || 80);
      setAutoCompletadoMsg(`Valores base de unidad cargados: ${(assignedVehicle?.odometroActual || 45280).toLocaleString()} km`);
      setTimeout(() => setAutoCompletadoMsg(null), 3500);
    }
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

    const targetPlaca = assignedVehicle?.placa || selectedVehiclePlaca;
    const targetServicio = servicio || selectedService;
    const targetUbicacion = ubicacionManual.trim() || currentUbicacion || 'Cochera Huancayo';

    // Persistir ubicación en contexto para futuros registros
    setCurrentUbicacion(targetUbicacion);
    setSelectedService(targetServicio);

    try {
      const res = await registrarCheckIn({
        placa: targetPlaca,
        vehiculoId: assignedVehicle?.id,
        odometro: Number(odometro),
        combustible: Number(combustible),
        checklist: allChecked,
        checklistResumen: resumenChecklist,
        estadoGeneral,
        conductor: currentDriver,
        servicio: targetServicio,
        ubicacion: targetUbicacion,
        observaciones: observaciones.trim(),
        latitud: gpsCoords?.latitud || null,
        longitud: gpsCoords?.longitud || null,
        precision: gpsCoords?.precision || null,
      });

      // Payload completo para Google Sheets (Requerimiento 4)
      const payloadWebhook = {
        'Fecha/Hora': fechaHoraActual,
        'Acción': 'Check-in',
        'Nombre del Conductor': currentDriver,
        'Placa seleccionada': targetPlaca,
        'Servicio seleccionado': targetServicio,
        'Ubicación escrita manualmente': targetUbicacion,
        'Kilometraje': Number(odometro),
        'Combustible (%)': `${combustible}%`,
        'Estado General': estadoGeneral,
        'Resumen del Checklist': resumenChecklist,
        'Observaciones': observaciones.trim(),
        'Coordenadas GPS': gpsCoords ? `${gpsCoords.latitud}, ${gpsCoords.longitud}` : 'Sin GPS',

        // Claves técnicas para compatibilidad de columnas existentes
        fechaHora: fechaHoraActual,
        tipoEvento: 'Check-in',
        accion: 'Check-in',
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
        estadoGeneral,
        checklist_condicion: resumenChecklist,
        checklistResumen: resumenChecklist,
        observaciones: observaciones.trim(),
        latitud: gpsCoords?.latitud || null,
        longitud: gpsCoords?.longitud || null,
        precision: gpsCoords?.precision || null,
        coordenadas: gpsCoords ? `${gpsCoords.latitud}, ${gpsCoords.longitud}` : '',
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
    <div className="space-y-4 text-[#9c9c9d] pb-8">
      {/* Header con Conductor Activo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/conductor')}
          className="p-2 rounded-[10px] telemetry-well border border-white/[0.08] text-[#9c9c9d] hover:text-[#ffffff] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-black text-[#ffffff] font-sans">
            Check-in de Turno
          </h1>
          <div className="text-[10px] font-mono text-[#6a6b6c] flex items-center gap-1.5">
            <User className="w-3 h-3 text-[#ff6363]" />
            <span>Operador: <strong className="text-white">{currentDriver}</strong></span>
          </div>
        </div>
      </div>

      {/* Banner de Éxito al Registrar */}
      {success && (
        <div className="p-4 rounded-2xl bg-[#092b1e] border border-[#59d499] text-[#59d499] flex items-center gap-3 font-mono animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs font-bold">
            {isOfflineRecord
              ? '¡CHECK-IN GUARDADO OFFLINE! Se transmitirá al recuperar señal.'
              : '¡CHECK-IN REGISTRADO CON ÉXITO! Sincronizado en Google Sheets y Firebase.'}
          </div>
        </div>
      )}

      {/* Mensaje de Autocompletado */}
      {autoCompletadoMsg && (
        <div className="p-3 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] flex items-center gap-2 text-xs font-mono animate-in fade-in">
          <Zap className="w-4 h-4 shrink-0 text-[#38bdf8]" />
          <span>{autoCompletadoMsg}</span>
        </div>
      )}

      {/* 1. SELECTORES MANUALES: PLACA Y TIPO DE SERVICIO (Requerimiento 1) */}
      <div className="cockpit-panel border border-white/[0.08] p-4.5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-white">
            <Truck className="w-3.5 h-3.5 text-[#ff6363]" />
            <span>00 // Asignación de Unidad y Servicio</span>
          </div>
          <span className="text-[10px] font-mono text-[#59d499] bg-[#59d499]/10 px-2 py-0.5 rounded-full border border-[#59d499]/30 font-bold">
            Oficial VIP CAR
          </span>
        </div>

        {/* Selector de Placa con Buscador (30 equipos) */}
        <SearchableSelect
          id="select-flota-checkin"
          label="Vehículo Asignado (Placa Oficial)"
          icon={Truck}
          value={assignedVehicle?.placa || selectedVehiclePlaca}
          onChange={(newPlaca) => handleVehicleChange(newPlaca)}
          options={(unidades || []).map((u) => ({
            value: u.placa,
            label: `${u.placa} • ${u.tipo}`,
            sublabel: u.tipoDetalle,
            badge: u.codigo,
          }))}
          placeholder="Escribe para filtrar placa (ej: BHF, W7W, Sprinter...)"
        />

        {/* Selector de Servicio con Buscador (16 servicios) */}
        <SearchableSelect
          id="select-servicio-checkin"
          label="Tipo de Servicio Actual"
          icon={Briefcase}
          value={servicio}
          onChange={(newServ) => setServicio(newServ)}
          options={(servicios || []).map((s) => ({
            value: s,
            label: s,
            sublabel: '',
            badge: 'Servicio',
          }))}
          placeholder="Escribe para filtrar servicio (ej: Aeropuerto, OCP, Almacén...)"
        />

        {/* 2. UBICACIÓN / TERMINAL EN TEXTO LIBRE (Requerimiento 2: SIN botón visible de GPS) */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="input-ubicacion-checkin"
            className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8e939e] flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Ubicación de Salida / Dónde estás *
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Texto libre</span>
          </label>
          <input
            id="input-ubicacion-checkin"
            type="text"
            required
            value={ubicacionManual}
            onChange={(e) => setUbicacionManual(e.target.value)}
            placeholder="Ej: Cochera Huancayo, Aeropuerto Jauja, Base Toromocho..."
            className="w-full bg-[#0a0c0e] border border-white/[0.15] rounded-2xl px-3.5 py-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-[#626773] font-mono px-1">
            Escribe manualmente tu ubicación. Las coordenadas GPS se capturan en segundo plano.
          </p>
        </div>

        {/* Tarjeta de Especificaciones de la Unidad */}
        <div className="w-full telemetry-well border border-white/[0.08] p-3.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="text-[10px] text-[#8e939e] uppercase font-mono font-bold">
              {assignedVehicle?.tipoDetalle || assignedVehicle?.tipo}
            </div>
            <div className="text-xs sm:text-sm font-black text-white font-sans truncate">
              {assignedVehicle?.marca} {assignedVehicle?.modelo}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono truncate">
              {servicio}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="font-mono font-black text-sm text-[#ff6363] px-3 py-1 rounded-full telemetry-well border border-[#ff6363]/50 tracking-wider shadow-md">
              {assignedVehicle?.placa}
            </span>
            <span className="text-[10px] text-[#8e939e] font-mono mt-1">
              Base: {(assignedVehicle?.odometroActual ?? 45280).toLocaleString()} km
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Odómetro Inicial */}
        <div className="cockpit-panel border border-white/[0.08] p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#6a6b6c] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#ff6363]" />
              01 // Odómetro Inicial *
            </label>
            <button
              type="button"
              onClick={handleAutocompletarUltimo}
              className="text-[11px] font-mono text-[#ff6363] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <RotateCcw className="w-3 h-3" />
              Autocompletar último
            </button>
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              required
              min={1}
              value={odometro}
              onChange={(e) => setOdometro(e.target.value)}
              className="w-full telemetry-well border border-white/[0.1] rounded-full px-4 py-3 text-2xl font-mono font-black text-[#ffffff] text-center tracking-widest focus:outline-none focus:border-[#ff6363]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6a6b6c] font-bold font-mono">
              KM
            </span>
          </div>

          <div className="mt-1">
            <SemaforoBadge odometro={Number(odometro) || assignedVehicle?.odometroActual || 45280} />
          </div>
        </div>

        {/* Nivel de Combustible */}
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

        {/* 3. NUEVO CHECKLIST OFICIAL DE 43 PUNTOS POR CATEGORÍAS (Requerimiento 3) */}
        <div className="cockpit-panel border border-white/[0.08] p-4 sm:p-5 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/[0.06] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#ff6363]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  03 // Checklist Oficial (43 Puntos)
                </h3>
              </div>
              <p className="text-[10px] text-[#8e939e] font-mono mt-0.5">
                Por defecto todos conformes. Desmarca en rojo si detectas alguna falla.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={marcarTodosConformes}
                className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer font-bold"
              >
                Resetear 43/43
              </button>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                  allChecked
                    ? 'bg-[#59d499]/15 text-[#59d499] border-[#59d499]/40'
                    : 'bg-[#ff6363]/15 text-[#ff6363] border-[#ff6363]/40'
                }`}
              >
                {allChecked ? '43/43 CONFORME' : `${conformesCount}/43 (${itemsConFalla.length} FALLAS)`}
              </span>
            </div>
          </div>

          {/* Acordeones de las 7 Categorías */}
          <div className="space-y-2 pt-1">
            {(CHECKLIST_CATEGORIAS || []).map((cat) => {
              const itemsCat = cat.items || [];
              const conformesEnCat = itemsCat.filter((it) => checklist[it.id]).length;
              const tieneFallas = conformesEnCat < itemsCat.length;
              const estaAbierto = categoriasAbiertas[cat.id];

              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl border transition-colors overflow-hidden ${
                    tieneFallas
                      ? 'border-[#ff6363]/40 bg-[#160a0d]'
                      : 'border-white/[0.08] bg-[#07080a]'
                  }`}
                >
                  {/* Encabezado del Acordeón */}
                  <button
                    type="button"
                    onClick={() => toggleCategoria(cat.id)}
                    className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          tieneFallas ? 'bg-[#ff6363] animate-pulse' : 'bg-[#59d499]'
                        }`}
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        {cat.titulo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          tieneFallas
                            ? 'bg-[#ff6363]/20 text-[#ff6363]'
                            : 'bg-white/[0.06] text-[#8e939e]'
                        }`}
                      >
                        {conformesEnCat}/{itemsCat.length}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8e939e] transition-transform duration-200 ${
                          estaAbierto ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Lista de Ítems dentro de la Categoría */}
                  {estaAbierto && (
                    <div className="p-2.5 pt-0 space-y-1.5 border-t border-white/[0.04]">
                      {(itemsCat || []).map((item) => {
                        const isChecked = checklist[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleCheck(item.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                              isChecked
                                ? 'telemetry-well border-white/[0.06] hover:border-white/[0.15]'
                                : 'bg-[#2d0e14]/70 border-[#ff6363]/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span className="text-[10px] font-mono text-[#8e939e] font-bold shrink-0 mt-0.5">
                                #{String(item.num).padStart(2, '0')}
                              </span>
                              <span
                                className={`text-xs font-mono leading-tight ${
                                  isChecked ? 'text-slate-200' : 'text-[#ff6363] font-bold'
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-[#59d499] text-black font-bold'
                                  : 'bg-[#ff6363] text-white font-bold shadow-md'
                              }`}
                            >
                              {isChecked ? (
                                <Check className="w-3 h-3 stroke-[3]" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

        {/* Botón Cockpit Action Cápsula - Sticky */}
        <button
          type="submit"
          disabled={loading || success}
          className="btn-cockpit-action w-full py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wide rounded-full font-mono font-bold active:scale-98 disabled:opacity-50 cursor-pointer shadow-2xl sticky bottom-4 z-10 backdrop-blur-md"
        >
          <ClipboardCheck className="w-4 h-4 stroke-[2.5]" />
          <span>
            {loading ? 'SINCRONIZANDO EN FIRESTORE & SHEETS...' : 'CONFIRMAR CHECK-IN DE TURNO'}
          </span>
        </button>
      </form>
    </div>
  );
}
