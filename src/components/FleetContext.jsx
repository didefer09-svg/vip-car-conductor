/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { db, isConfigured } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  OFFICIAL_UNIDADES,
  OFFICIAL_SERVICIOS,
  DEFAULT_PLACA,
  DEFAULT_SERVICIO,
  DEFAULT_UBICACION,
} from '../data/fleetData';

const FleetContext = createContext(null);

export const DEFAULT_DRIVERS = [
  'Carlos Huamán',
  'Alejandro Ruiz',
  'Segundo Ramos',
  'Marco Mendoza',
  'Luis Alarcón',
  'Jorge Quispe',
  'Edwin Palomino',
  'Dante Flores',
  'Víctor Romaní',
];

export const TERMINAL_COORDINATES = {
  'Cochera Huancayo': { latitud: -12.0651, longitud: -75.2049, nombre: 'Cochera Huancayo' },
  'Terminal Huancayo': { latitud: -12.0651, longitud: -75.2049, nombre: 'Terminal Huancayo (Junín)' },
  'Base Minera Toromocho': { latitud: -11.6167, longitud: -76.1333, nombre: 'Base Minera Toromocho (Morococha)' },
  'Socavón Nivel 4': { latitud: -11.6215, longitud: -76.1402, nombre: 'Socavón Nivel 4 (Subterráneo)' },
  'Base Central La Oroya': { latitud: -11.5281, longitud: -75.9014, nombre: 'Base Central La Oroya' },
  'Campamento Tunshuruco': { latitud: -11.6420, longitud: -76.1150, nombre: 'Campamento Tunshuruco' },
  'Aeropuerto Jauja': { latitud: -11.7831, longitud: -75.4739, nombre: 'Aeropuerto Francisco Carlé (Jauja)' },
};

export const INITIAL_VEHICLES = OFFICIAL_UNIDADES;

const INITIAL_BITACORA = [
  {
    id: 'bit-001',
    fechaHora: '2026-10-28 07:15',
    conductor: 'Carlos Huamán',
    operador: 'Carlos Huamán',
    placa: 'BHF-821',
    servicio: 'OFICINA CENTRAL (Global - Huancayo - TH-01)',
    tipoRegistro: 'Check-in Turno Operativo',
    tipoEvento: 'Check-in',
    odometro: 45280,
    combustible: 80,
    nivelCombustible: '80%',
    checklistEstado: '43/43 Conforme (100%)',
    estadoGeneral: 'Conforme / Operativo',
    ubicacion: 'Cochera Huancayo',
    proyecto: 'OFICINA CENTRAL (Global - Huancayo - TH-01)',
    estado: 'OK',
  },
];

export function FleetProvider({ children }) {
  // Inicialización de vehículos asegurando que cargue la lista oficial de 30 unidades
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_vehicles_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= OFFICIAL_UNIDADES.length) {
          return parsed;
        }
      }
      return OFFICIAL_UNIDADES;
    } catch {
      return OFFICIAL_UNIDADES;
    }
  });

  const [bitacora, setBitacora] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_bitacora');
      return saved ? JSON.parse(saved) : INITIAL_BITACORA;
    } catch {
      return INITIAL_BITACORA;
    }
  });

  // Conductor Activo (Texto libre persistido)
  const [currentDriver, setCurrentDriverState] = useState(() => {
    try {
      return localStorage.getItem('vipcar_current_driver') || 'Carlos Huamán';
    } catch {
      return 'Carlos Huamán';
    }
  });

  // Placa Seleccionada (30 unidades oficiales)
  const [selectedVehiclePlaca, setSelectedVehiclePlacaState] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_selected_vehicle_placa');
      const existe = (OFFICIAL_UNIDADES || []).some((u) => u.placa === saved);
      return existe ? saved : DEFAULT_PLACA;
    } catch {
      return DEFAULT_PLACA;
    }
  });

  // Tipo de Servicio Seleccionado (16 servicios oficiales)
  const [selectedService, setSelectedServiceState] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_selected_service');
      const existe = (OFFICIAL_SERVICIOS || []).includes(saved);
      return existe ? saved : DEFAULT_SERVICIO;
    } catch {
      return DEFAULT_SERVICIO;
    }
  });

  // Ubicación / Terminal en Texto Libre
  const [currentUbicacion, setCurrentUbicacionState] = useState(() => {
    try {
      return (
        localStorage.getItem('vipcar_current_ubicacion') ||
        localStorage.getItem('vipcar_current_terminal') ||
        DEFAULT_UBICACION
      );
    } catch {
      return DEFAULT_UBICACION;
    }
  });

  const [availableDrivers, setAvailableDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_available_drivers');
      return saved ? JSON.parse(saved) : DEFAULT_DRIVERS;
    } catch {
      return DEFAULT_DRIVERS;
    }
  });

  const setCurrentDriver = (name) => {
    const val = typeof name === 'string' ? name : '';
    setCurrentDriverState(val);
    try {
      localStorage.setItem('vipcar_current_driver', val);
    } catch (e) {
      console.warn('Error saving current driver', e);
    }
  };

  const setSelectedVehiclePlaca = (placa) => {
    if (!placa) return;
    setSelectedVehiclePlacaState(placa);
    try {
      localStorage.setItem('vipcar_selected_vehicle_placa', placa);
    } catch (e) {
      console.warn('Error saving selected vehicle placa', e);
    }
  };

  const setSelectedService = (servicio) => {
    if (!servicio) return;
    setSelectedServiceState(servicio);
    try {
      localStorage.setItem('vipcar_selected_service', servicio);
    } catch (e) {
      console.warn('Error saving selected service', e);
    }
  };

  const setCurrentUbicacion = (ubicacion) => {
    const val = typeof ubicacion === 'string' ? ubicacion : '';
    setCurrentUbicacionState(val);
    try {
      localStorage.setItem('vipcar_current_ubicacion', val);
      localStorage.setItem('vipcar_current_terminal', val);
    } catch (e) {
      console.warn('Error saving current ubicacion', e);
    }
  };

  // Alias para mantener compatibilidad con cualquier componente que use terminal
  const currentTerminal = currentUbicacion;
  const setCurrentTerminal = setCurrentUbicacion;

  const selectedVehicle =
    (vehicles || []).find((v) => v?.placa === selectedVehiclePlaca) ||
    (vehicles && vehicles[0]) ||
    OFFICIAL_UNIDADES[0];

  const addCustomDriver = (name) => {
    if (!name || availableDrivers.includes(name)) return;
    const updated = [...availableDrivers, name];
    setAvailableDrivers(updated);
    try {
      localStorage.setItem('vipcar_available_drivers', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom driver', e);
    }
  };

  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('vipcar_vehicles_v3', JSON.stringify(vehicles));
    } catch (e) {
      console.warn('Error saving vehicles to localStorage', e);
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem('vipcar_bitacora', JSON.stringify(bitacora));
    } catch (e) {
      console.warn('Error saving bitacora to localStorage', e);
    }
  }, [bitacora]);

  const registrarCheckIn = async ({
    placa,
    vehiculoId,
    odometro,
    nivelCombustible,
    combustible,
    observaciones,
    checklist,
    checklistResumen,
    estadoGeneral,
    conductor,
    servicio,
    ubicacion,
    latitud,
    longitud,
    precision,
  }) => {
    const targetPlaca = placa || selectedVehiclePlaca;
    const targetServicio = servicio || selectedService;
    const targetUbicacion = ubicacion || currentUbicacion;
    const fuel = nivelCombustible ?? combustible ?? 75;
    const locData = latitud != null && longitud != null ? { latitud, longitud, precision } : null;

    setVehicles((prev) =>
      (prev || []).map((v) =>
        v.placa === targetPlaca
          ? {
              ...v,
              odometroActual: odometro,
              nivelCombustible: fuel,
              conductorActual: conductor || currentDriver,
              servicioActual: targetServicio,
              ubicacionActual: targetUbicacion,
              ultimaUbicacion: locData,
            }
          : v
      )
    );

    const nuevoRegistro = {
      id: `bit-${Date.now()}`,
      fechaHora: new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      conductor: conductor || currentDriver,
      operador: conductor || currentDriver,
      placa: targetPlaca,
      servicio: targetServicio,
      tipoServicio: targetServicio,
      tipoRegistro: 'Check-in Turno Operativo',
      tipoEvento: 'Check-in',
      odometro,
      kilometraje: odometro,
      combustible: fuel,
      nivelCombustible: `${fuel}%`,
      checklist: checklist || null,
      checklistResumen: checklistResumen || '43/43 Conforme (100%)',
      checklistEstado: checklistResumen || (observaciones ? `Observaciones: ${observaciones}` : '43/43 Conforme'),
      estadoGeneral: estadoGeneral || 'Conforme / Operativo',
      observaciones: observaciones || '',
      ubicacion: targetUbicacion,
      proyecto: targetServicio,
      estado: estadoGeneral === 'Con Observaciones' ? 'Alerta' : 'OK',
      latitud: locData?.latitud || null,
      longitud: locData?.longitud || null,
      precision: locData?.precision || null,
      coordenadas: locData ? `${locData.latitud}, ${locData.longitud}` : '',
    };

    setBitacora((prev) => [nuevoRegistro, ...prev]);

    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'bitacora', nuevoRegistro.id), {
          ...nuevoRegistro,
          timestamp: new Date().toISOString(),
        });
        const vId = vehiculoId || (vehicles || []).find((v) => v?.placa === targetPlaca)?.id || 'um-01';
        if (vId) {
          await updateDoc(doc(db, 'vehiculos', vId), {
            odometroActual: odometro,
            nivelCombustible: fuel,
            conductorActual: conductor || currentDriver,
            servicioActual: targetServicio,
            ubicacionActual: targetUbicacion,
            ultimaUbicacion: locData,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Error al sincronizar Check-in con Firestore:', err);
      }
    }

    return nuevoRegistro;
  };

  const registrarCheckOut = async ({
    placa,
    vehiculoId,
    odometro,
    odometroFinal,
    combustible,
    nivelCombustibleFinal,
    novedades,
    evaluacion,
    kmRecorridos,
    conductor,
    servicio,
    ubicacion,
    latitud,
    longitud,
    precision,
  }) => {
    const targetPlaca = placa || selectedVehiclePlaca;
    const targetServicio = servicio || selectedService;
    const targetUbicacion = ubicacion || currentUbicacion;
    const finalOdo = odometroFinal ?? odometro;
    const finalFuel = nivelCombustibleFinal ?? combustible ?? 65;
    const locData = latitud != null && longitud != null ? { latitud, longitud, precision } : null;

    setVehicles((prev) =>
      (prev || []).map((v) =>
        v.placa === targetPlaca
          ? {
              ...v,
              odometroActual: finalOdo,
              nivelCombustible: finalFuel,
              conductorActual: conductor || currentDriver,
              servicioActual: targetServicio,
              ubicacionActual: targetUbicacion,
              ultimaUbicacion: locData,
            }
          : v
      )
    );

    const nuevoRegistro = {
      id: `bit-${Date.now()}`,
      fechaHora: new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      conductor: conductor || currentDriver,
      operador: conductor || currentDriver,
      placa: targetPlaca,
      servicio: targetServicio,
      tipoServicio: targetServicio,
      tipoRegistro: 'Check-out Fin de Turno',
      tipoEvento: 'Check-out',
      odometro: finalOdo,
      kilometraje: finalOdo,
      combustible: finalFuel,
      nivelCombustible: `${finalFuel}%`,
      checklistEstado: novedades ? `Novedades: ${novedades}` : `Evaluación: ${evaluacion || 'Óptimo'} (+${kmRecorridos || 0} km)`,
      checklistResumen: `Cierre: ${evaluacion || 'Óptimo'} (+${kmRecorridos || 0} km)`,
      estadoGeneral: evaluacion || 'Óptimo',
      observaciones: novedades || `Evaluación: ${evaluacion || 'Óptimo'} (+${kmRecorridos || 0} km)`,
      evaluacion: evaluacion || 'Óptimo',
      ubicacion: targetUbicacion,
      proyecto: targetServicio,
      estado: 'OK',
      latitud: locData?.latitud || null,
      longitud: locData?.longitud || null,
      precision: locData?.precision || null,
      coordenadas: locData ? `${locData.latitud}, ${locData.longitud}` : '',
    };

    setBitacora((prev) => [nuevoRegistro, ...prev]);

    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'bitacora', nuevoRegistro.id), {
          ...nuevoRegistro,
          timestamp: new Date().toISOString(),
        });
        const vId = vehiculoId || (vehicles || []).find((v) => v?.placa === targetPlaca)?.id || 'um-01';
        if (vId) {
          await updateDoc(doc(db, 'vehiculos', vId), {
            odometroActual: finalOdo,
            nivelCombustible: finalFuel,
            conductorActual: conductor || currentDriver,
            servicioActual: targetServicio,
            ubicacionActual: targetUbicacion,
            ultimaUbicacion: locData,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Error al sincronizar Check-out con Firestore:', err);
      }
    }

    return nuevoRegistro;
  };

  const reportarAveriaEmergencia = async ({
    placa,
    vehiculoId,
    tipoFalla,
    severidad,
    descripcion,
    conductor,
    servicio,
    ubicacion,
    foto,
    latitud,
    longitud,
    precision,
  }) => {
    const targetPlaca = placa || selectedVehiclePlaca;
    const targetServicio = servicio || selectedService;
    const targetUbicacion = ubicacion || currentUbicacion;
    const locData = latitud != null && longitud != null ? { latitud, longitud, precision } : null;

    setVehicles((prev) =>
      (prev || []).map((v) =>
        v.placa === targetPlaca
          ? {
              ...v,
              estadoOperativo: 'Inhabilitado por Avería',
              conductorActual: conductor || currentDriver,
              ultimaUbicacion: locData,
            }
          : v
      )
    );

    const veh = (vehicles || []).find((v) => v?.placa === targetPlaca);

    const nuevoRegistro = {
      id: `bit-${Date.now()}`,
      fechaHora: new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      conductor: conductor || currentDriver,
      operador: conductor || currentDriver,
      placa: targetPlaca,
      servicio: targetServicio,
      tipoServicio: targetServicio,
      tipoRegistro: `SOS Avería: ${tipoFalla} (${severidad})`,
      tipoEvento: 'SOS',
      odometro: veh?.odometroActual || 45280,
      kilometraje: veh?.odometroActual || 45280,
      combustible: veh?.nivelCombustible || 75,
      nivelCombustible: `${veh?.nivelCombustible || 75}%`,
      checklistEstado: descripcion,
      checklistResumen: `SOS: ${tipoFalla} (${severidad})`,
      estadoGeneral: 'Emergencia SOS',
      observaciones: descripcion,
      ubicacion: targetUbicacion,
      proyecto: targetServicio,
      estado: 'Alerta',
      tipoFalla,
      severidad,
      descripcion,
      foto: foto || null,
      latitud: locData?.latitud || null,
      longitud: locData?.longitud || null,
      precision: locData?.precision || null,
      coordenadas: locData ? `${locData.latitud}, ${locData.longitud}` : '',
    };

    setBitacora((prev) => [nuevoRegistro, ...prev]);

    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'bitacora', nuevoRegistro.id), {
          ...nuevoRegistro,
          timestamp: new Date().toISOString(),
        });
        await setDoc(doc(db, 'averias', nuevoRegistro.id), {
          ...nuevoRegistro,
          timestamp: new Date().toISOString(),
        });
        const vId = vehiculoId || (vehicles || []).find((v) => v?.placa === targetPlaca)?.id || 'um-01';
        if (vId) {
          await updateDoc(doc(db, 'vehiculos', vId), {
            estadoOperativo: 'Inhabilitado por Avería',
            ultimaUbicacion: locData,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Error al sincronizar avería SOS con Firestore:', err);
      }
    }

    return nuevoRegistro;
  };

  const sincronizarColaManual = () => {
    setPendingSyncCount(0);
  };

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        unidades: OFFICIAL_UNIDADES,
        servicios: OFFICIAL_SERVICIOS,
        bitacora,
        pendingSyncCount,
        currentDriver,
        setCurrentDriver,
        selectedVehiclePlaca,
        setSelectedVehiclePlaca,
        selectedService,
        setSelectedService,
        currentUbicacion,
        setCurrentUbicacion,
        currentTerminal,
        setCurrentTerminal,
        selectedVehicle,
        availableDrivers,
        addCustomDriver,
        terminalCoordinates: TERMINAL_COORDINATES,
        sincronizarColaManual,
        registrarCheckIn,
        registrarCheckOut,
        reportarAveriaEmergencia,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) {
    return {
      vehicles: OFFICIAL_UNIDADES,
      unidades: OFFICIAL_UNIDADES,
      servicios: OFFICIAL_SERVICIOS,
      bitacora: INITIAL_BITACORA,
      pendingSyncCount: 0,
      currentDriver: 'Carlos Huamán',
      setCurrentDriver: () => {},
      selectedVehiclePlaca: DEFAULT_PLACA,
      setSelectedVehiclePlaca: () => {},
      selectedService: DEFAULT_SERVICIO,
      setSelectedService: () => {},
      currentUbicacion: DEFAULT_UBICACION,
      setCurrentUbicacion: () => {},
      currentTerminal: DEFAULT_UBICACION,
      setCurrentTerminal: () => {},
      selectedVehicle: OFFICIAL_UNIDADES[0],
      availableDrivers: DEFAULT_DRIVERS,
      addCustomDriver: () => {},
      terminalCoordinates: TERMINAL_COORDINATES,
      sincronizarColaManual: () => {},
      registrarCheckIn: () => {},
      registrarCheckOut: () => {},
      reportarAveriaEmergencia: () => {},
    };
  }
  return context;
}
