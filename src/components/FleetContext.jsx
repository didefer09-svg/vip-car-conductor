/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { db, isConfigured } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

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
  'Terminal Huancayo': { latitud: -12.0651, longitud: -75.2049, nombre: 'Terminal Huancayo (Junín)' },
  'Base Minera Toromocho': { latitud: -11.6167, longitud: -76.1333, nombre: 'Base Minera Toromocho (Morococha)' },
  'Socavón Nivel 4': { latitud: -11.6215, longitud: -76.1402, nombre: 'Socavón Nivel 4 (Subterráneo)' },
  'Base Central La Oroya': { latitud: -11.5281, longitud: -75.9014, nombre: 'Base Central La Oroya' },
  'Campamento Tunshuruco': { latitud: -11.6420, longitud: -76.1150, nombre: 'Campamento Tunshuruco' },
};

/**
 * VIP CAR HUANCAYO - Flota Oficial Completa (18 Unidades)
 * Extraída de vipcarhuancayo.com y portal corporativo
 */
export const INITIAL_VEHICLES = [
  {
    id: 'veh-01',
    placa: 'W4E-892',
    marca: 'Toyota',
    modelo: 'Hilux 4x4 Doble Cabina Minera',
    anio: 2024,
    tipo: 'Pickup 4x4',
    traccion: '4x4',
    motor: '2.8L Turbo Diesel 1GD-FTV (201 HP)',
    capacidadCarga: '1,000 kg (5 Asientos)',
    odometroActual: 14750,
    ultimoMantenimiento: 10000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Minera Chinalco Perú (Toromocho)',
    conductorActual: 'Carlos Huamán',
    nivelCombustible: 75,
    tarifaDiariaUSD: 110,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/toyota-hilux-4x4-1.jpg',
    documentos: {
      soat: 'Vigente hasta 12/2026 (Rimac)',
      poliza: 'Rimac Seguros Todo Riesgo Minero #982314',
      revisionTecnica: 'Aprobado MTC Junín 03/2026',
    },
  },
  {
    id: 'veh-02',
    placa: 'W2A-710',
    marca: 'Toyota',
    modelo: 'Fortuner 4x4 D-4D 7 Asientos',
    anio: 2024,
    tipo: 'SUV 4x4',
    traccion: '4x4',
    motor: '2.8L Turbo Diesel Intercooler (201 HP)',
    capacidadCarga: '750 kg (7 Asientos)',
    odometroActual: 20120,
    ultimoMantenimiento: 15000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Mantenimiento Urgente',
    empresaAsignada: 'Volcan Compañía Minera (Yauli)',
    conductorActual: 'Marcos Mendoza',
    nivelCombustible: 40,
    tarifaDiariaUSD: 130,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/fortuner-4x4-1.jpg',
    documentos: {
      soat: 'Vigente hasta 08/2026 (Pacífico)',
      poliza: 'Pacífico Seguros Flota Corporativa #771209',
      revisionTecnica: 'Vencido - Requiere servicio preventivo',
    },
  },
  {
    id: 'veh-03',
    placa: 'W5B-441',
    marca: 'Toyota',
    modelo: 'Land Cruiser Prado TXL 4WD',
    anio: 2023,
    tipo: 'SUV 4x4',
    traccion: '4x4',
    motor: '3.0L Turbo Diesel D-4D 4WD',
    capacidadCarga: '800 kg (7 Asientos)',
    odometroActual: 8200,
    ultimoMantenimiento: 5000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Constructora San Martín (Carretera Central)',
    conductorActual: 'Jorge Quispe',
    nivelCombustible: 90,
    tarifaDiariaUSD: 160,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/land-cruiser-prado.jpg',
    documentos: {
      soat: 'Vigente hasta 10/2026 (Rimac)',
      poliza: 'Rimac Flotas Ejecutivas #661244',
      revisionTecnica: 'Aprobado MTC 04/2026',
    },
  },
  {
    id: 'veh-04',
    placa: 'W1Z-390',
    marca: 'Toyota',
    modelo: 'RAV4 2.0 AWD',
    anio: 2023,
    tipo: 'SUV',
    traccion: '4x2',
    motor: '2.0L Dual VVT-i (170 HP)',
    capacidadCarga: '550 kg (5 Asientos)',
    odometroActual: 19850,
    ultimoMantenimiento: 15000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Nexa Resources (El Porvenir)',
    conductorActual: 'Raúl Soto',
    nivelCombustible: 60,
    tarifaDiariaUSD: 85,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/toyota-rav-4.jpg',
    documentos: {
      soat: 'Vigente hasta 11/2026 (La Positiva)',
      poliza: 'La Positiva Flota #330198',
      revisionTecnica: 'Aprobado MTC 01/2026',
    },
  },
  {
    id: 'veh-05',
    placa: 'W3M-112',
    marca: 'Hyundai',
    modelo: 'Tucson 2.0 GL Automática',
    anio: 2024,
    tipo: 'SUV',
    traccion: '4x2',
    motor: '2.0L Nu MPI Automático (154 HP)',
    capacidadCarga: '500 kg (5 Asientos)',
    odometroActual: 3100,
    ultimoMantenimiento: 0,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Disponible',
    empresaAsignada: 'Base Central Huancayo (Patio)',
    conductorActual: null,
    nivelCombustible: 100,
    tarifaDiariaUSD: 80,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/Hyundai-tucson.jpg',
    documentos: {
      soat: 'Vigente hasta 01/2027 (Rimac)',
      poliza: 'Rimac Flotas #889211',
      revisionTecnica: 'Exonerado por año nuevo 2024',
    },
  },
  {
    id: 'veh-06',
    placa: 'W4F-903',
    marca: 'Hyundai',
    modelo: 'Santa Fe 2.2 CRDi (3 Filas)',
    anio: 2023,
    tipo: 'SUV',
    traccion: '4x2',
    motor: '2.2L Turbo Diesel Intercooler (197 HP)',
    capacidadCarga: '700 kg (7 Asientos)',
    odometroActual: 10450,
    ultimoMantenimiento: 10000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Disponible',
    empresaAsignada: 'Base La Oroya',
    conductorActual: null,
    nivelCombustible: 85,
    tarifaDiariaUSD: 100,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/Hyundai-santa-fe.jpg',
    documentos: {
      soat: 'Vigente hasta 05/2026 (Mapfre)',
      poliza: 'Mapfre Corporativo #440021',
      revisionTecnica: 'Aprobado MTC 02/2026',
    },
  },
  {
    id: 'veh-07',
    placa: 'W6C-284',
    marca: 'Kia',
    modelo: 'Sportage 2.0 EX',
    anio: 2024,
    tipo: 'SUV',
    traccion: '4x2',
    motor: '2.0L MPI Gasolina (154 HP)',
    capacidadCarga: '520 kg (5 Asientos)',
    odometroActual: 9600,
    ultimoMantenimiento: 5000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Minera Corona (Yauricocha)',
    conductorActual: 'Gustavo Meza',
    nivelCombustible: 70,
    tarifaDiariaUSD: 85,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2025/01/kiasportage2.jpg',
    documentos: {
      soat: 'Vigente hasta 09/2026 (Pacífico)',
      poliza: 'Pacífico Seguros #551922',
      revisionTecnica: 'Aprobado MTC 02/2026',
    },
  },
  {
    id: 'veh-08',
    placa: 'W1T-553',
    marca: 'Toyota',
    modelo: 'HiAce Commuter Minibús (17 Pax)',
    anio: 2023,
    tipo: 'Van / Minibús',
    traccion: '4x2',
    motor: '2.8L Turbo Diesel 1GD (174 HP)',
    capacidadCarga: '1,400 kg (17 Pasajeros)',
    odometroActual: 24600,
    ultimoMantenimiento: 20000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Minera Chinalco Perú (Toromocho)',
    conductorActual: 'Edwin Palomino',
    nivelCombustible: 80,
    tarifaDiariaUSD: 140,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/10/toyota-hiace.jpg',
    documentos: {
      soat: 'Vigente hasta 07/2026 (Rimac)',
      poliza: 'Rimac Seguros Transporte #223401',
      revisionTecnica: 'Aprobado MTC 03/2026',
    },
  },
  {
    id: 'veh-09',
    placa: 'W7H-192',
    marca: 'Hyundai',
    modelo: 'H1 Grand Miniván (12 Pax)',
    anio: 2024,
    tipo: 'Van / Minibús',
    traccion: '4x2',
    motor: '2.5L CRDi Turbo Diesel (170 HP)',
    capacidadCarga: '1,100 kg (12 Asientos)',
    odometroActual: 12100,
    ultimoMantenimiento: 10000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Disponible',
    empresaAsignada: 'Base Huancayo (Patio Central)',
    conductorActual: null,
    nivelCombustible: 95,
    tarifaDiariaUSD: 120,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/hyundai-h1.jpg',
    documentos: {
      soat: 'Vigente hasta 11/2026 (La Positiva)',
      poliza: 'La Positiva Pasajeros #778401',
      revisionTecnica: 'Exonerado por año 2024',
    },
  },
  {
    id: 'veh-10',
    placa: 'W3K-840',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter 515 CDI Minibús (21 Pax)',
    anio: 2023,
    tipo: 'Van / Minibús',
    traccion: '4x2',
    motor: '2.2L CDI Bi-Turbo Diesel (150 HP)',
    capacidadCarga: '2,200 kg (21 Asientos)',
    odometroActual: 30150,
    ultimoMantenimiento: 25000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Mantenimiento Urgente',
    empresaAsignada: 'Volcan Compañía Minera (Yauli)',
    conductorActual: 'Manuel Cárdenas',
    nivelCombustible: 35,
    tarifaDiariaUSD: 180,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/mercedes-benz-sprinter.jpg',
    documentos: {
      soat: 'Vigente hasta 06/2026 (Rimac)',
      poliza: 'Rimac Seguros Flota Bus #902144',
      revisionTecnica: 'Vencido - Servicio de frenos requerido',
    },
  },
  {
    id: 'veh-11',
    placa: 'W2P-615',
    marca: 'Toyota',
    modelo: 'Coaster Transporte de Personal (33 Pax)',
    anio: 2023,
    tipo: 'Vehículo Pesado',
    traccion: '4x2',
    motor: '4.0L Turbo Diesel Intercooler (150 HP)',
    capacidadCarga: '3,200 kg (33 Pasajeros)',
    odometroActual: 18400,
    ultimoMantenimiento: 15000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Minera Chinalco Perú (Toromocho)',
    conductorActual: 'Alberto Ramos',
    nivelCombustible: 85,
    tarifaDiariaUSD: 220,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/coaster-30-p.jpg',
    documentos: {
      soat: 'Vigente hasta 08/2026 (Mapfre)',
      poliza: 'Mapfre Seguro Colectivo #102944',
      revisionTecnica: 'Aprobado MTC 02/2026',
    },
  },
  {
    id: 'veh-12',
    placa: 'W5J-730',
    marca: 'Mercedes-Benz',
    modelo: 'Ómnibus Interurbano (46 Pax)',
    anio: 2024,
    tipo: 'Vehículo Pesado',
    traccion: '4x2',
    motor: 'OM 457 LA Diesel Euro V (360 HP)',
    capacidadCarga: '46 Pasajeros + Bodega 8m³',
    odometroActual: 14200,
    ultimoMantenimiento: 10000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Consorcio Vial Junín',
    conductorActual: 'Pedro Vilchez',
    nivelCombustible: 90,
    tarifaDiariaUSD: 300,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2025/01/bus01.jpg',
    documentos: {
      soat: 'Vigente hasta 12/2026 (Rimac)',
      poliza: 'Rimac Transporte Personal #882199',
      revisionTecnica: 'Aprobado MTC 04/2026',
    },
  },
  {
    id: 'veh-13',
    placa: 'W4L-911',
    marca: 'Isuzu',
    modelo: 'Camión de Personal Minero 4x4',
    anio: 2024,
    tipo: 'Vehículo Pesado',
    traccion: '4x4',
    motor: '5.2L Turbo Diesel Intercooler 4x4 (190 HP)',
    capacidadCarga: '28 Pasajeros / 4.5 Toneladas',
    odometroActual: 7900,
    ultimoMantenimiento: 5000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Minera Chinalco Perú (Toromocho)',
    conductorActual: 'Dante Flores',
    nivelCombustible: 80,
    tarifaDiariaUSD: 240,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2025/01/camion02.jpg',
    documentos: {
      soat: 'Vigente hasta 10/2026 (Pacífico)',
      poliza: 'Pacífico Todo Riesgo Minero #441920',
      revisionTecnica: 'Aprobado MTC 01/2026',
    },
  },
  {
    id: 'veh-14',
    placa: 'W6X-320',
    marca: 'Hino',
    modelo: 'Camión Furgón Minero 5TN',
    anio: 2024,
    tipo: 'Vehículo Pesado',
    traccion: '4x2',
    motor: '4.0L Turbo Diesel Intercooler (150 HP)',
    capacidadCarga: '5 Toneladas',
    odometroActual: 11100,
    ultimoMantenimiento: 10000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Disponible',
    empresaAsignada: 'Base Morococha',
    conductorActual: null,
    nivelCombustible: 90,
    tarifaDiariaUSD: 190,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2025/01/furg01.jpg',
    documentos: {
      soat: 'Vigente hasta 02/2027 (Rimac)',
      poliza: 'Rimac Transporte Carga Pesada #719204',
      revisionTecnica: 'Aprobado MTC 03/2026',
    },
  },
  {
    id: 'veh-15',
    placa: 'W2R-408',
    marca: 'Hino',
    modelo: 'Camión Cisterna Combustible/Agua 3000 Gal',
    anio: 2023,
    tipo: 'Vehículo Pesado',
    traccion: '4x2',
    motor: '7.7L Turbo Diesel Intercooler (260 HP)',
    capacidadCarga: '3,000 Galones / 10 Toneladas',
    odometroActual: 25050,
    ultimoMantenimiento: 20000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Mantenimiento Urgente',
    empresaAsignada: 'Nexa Resources (El Porvenir)',
    conductorActual: 'Víctor Romaní',
    nivelCombustible: 50,
    tarifaDiariaUSD: 260,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2025/01/cisterna.jpg',
    documentos: {
      soat: 'Vigente hasta 05/2026 (Rimac)',
      poliza: 'Rimac MATPEL / Materiales Peligrosos #338192',
      revisionTecnica: 'Vencido - Requiere inspección de válvula y cisterna',
    },
  },
  {
    id: 'veh-16',
    placa: 'W3Y-671',
    marca: 'Toyota',
    modelo: 'Corolla 1.8 Sedan Ejecutivo',
    anio: 2023,
    tipo: 'Vehículo Ligero',
    traccion: '4x2',
    motor: '1.8L Dual VVT-i Automático (138 HP)',
    capacidadCarga: '450 kg (5 Asientos)',
    odometroActual: 14850,
    ultimoMantenimiento: 10000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'En Servicio',
    empresaAsignada: 'Base Central Huancayo (Servicio Ejecutivo)',
    conductorActual: 'Jaime Cóndor',
    nivelCombustible: 80,
    tarifaDiariaUSD: 65,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/toyota-corolla.jpg',
    documentos: {
      soat: 'Vigente hasta 08/2026 (Pacífico)',
      poliza: 'Pacífico Flota Ligera #110294',
      revisionTecnica: 'Aprobado MTC 02/2026',
    },
  },
  {
    id: 'veh-17',
    placa: 'W1V-804',
    marca: 'Hyundai',
    modelo: 'Elantra 1.6 Automático',
    anio: 2024,
    tipo: 'Vehículo Ligero',
    traccion: '4x2',
    motor: '1.6L MPI Automático (126 HP)',
    capacidadCarga: '450 kg (5 Asientos)',
    odometroActual: 4800,
    ultimoMantenimiento: 0,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Disponible',
    empresaAsignada: 'Base Central Huancayo',
    conductorActual: null,
    nivelCombustible: 95,
    tarifaDiariaUSD: 65,
    imagen: 'https://vipcarhuancayo.com/wp-content/uploads/2021/08/hyundai-elantra.jpg',
    documentos: {
      soat: 'Vigente hasta 12/2026 (Rimac)',
      poliza: 'Rimac Flotas #402911',
      revisionTecnica: 'Exonerado por año 2024',
    },
  },
  {
    id: 'veh-18',
    placa: 'W5T-229',
    marca: 'Mazda',
    modelo: 'CX-3 2.0 Skyactiv-G',
    anio: 2023,
    tipo: 'SUV',
    traccion: '4x2',
    motor: '2.0L Skyactiv-G Automático (148 HP)',
    capacidadCarga: '480 kg (5 Asientos)',
    odometroActual: 6200,
    ultimoMantenimiento: 5000,
    intervaloMantenimiento: 5000,
    estadoOperativo: 'Disponible',
    empresaAsignada: 'Base Huancayo (Urb. La Merced)',
    conductorActual: null,
    nivelCombustible: 90,
    tarifaDiariaUSD: 70,
    documentos: {
      soat: 'Vigente hasta 11/2026 (Pacífico)',
      poliza: 'Pacífico Corporativo #992104',
      revisionTecnica: 'Aprobado MTC 03/2026',
    },
  },
];

const INITIAL_BITACORA = [
  {
    id: 'bit-001',
    fechaHora: '2026-10-19 07:15',
    conductor: 'Carlos Huamán',
    placa: 'W4E-892',
    tipoRegistro: 'Check-in Turno Mañana',
    odometro: 14750,
    nivelCombustible: '75%',
    checklistEstado: 'Aprobado sin incidencias',
    proyecto: 'Toromocho - Chinalco',
    estado: 'OK',
  },
  {
    id: 'bit-002',
    fechaHora: '2026-10-18 19:30',
    conductor: 'Carlos Huamán',
    placa: 'W4E-892',
    tipoRegistro: 'Check-out Turno Noche',
    odometro: 14750,
    nivelCombustible: '75%',
    checklistEstado: 'Entrega en campamento',
    proyecto: 'Toromocho - Chinalco',
    estado: 'OK',
  },
  {
    id: 'bit-003',
    fechaHora: '2026-10-18 07:00',
    conductor: 'Carlos Huamán',
    placa: 'W4E-892',
    tipoRegistro: 'Check-in Turno Mañana',
    odometro: 14685,
    nivelCombustible: '85%',
    checklistEstado: 'Aprobado',
    proyecto: 'Toromocho - Chinalco',
    estado: 'OK',
  },
];

export function FleetProvider({ children }) {
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_VEHICLES.length) {
          return parsed;
        }
      }
      return INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
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

  const [currentDriver, setCurrentDriverState] = useState(() => {
    try {
      return localStorage.getItem('vipcar_current_driver') || 'Carlos Huamán';
    } catch {
      return 'Carlos Huamán';
    }
  });

  const [currentTerminal, setCurrentTerminalState] = useState(() => {
    try {
      return localStorage.getItem('vipcar_current_terminal') || 'Terminal Huancayo';
    } catch {
      return 'Terminal Huancayo';
    }
  });

  const [selectedVehiclePlaca, setSelectedVehiclePlacaState] = useState(() => {
    try {
      return localStorage.getItem('vipcar_selected_vehicle_placa') || 'W4E-892';
    } catch {
      return 'W4E-892';
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

  const [availableTerminals, setAvailableTerminals] = useState(() => {
    try {
      const saved = localStorage.getItem('vipcar_available_terminals');
      return saved ? JSON.parse(saved) : Object.keys(TERMINAL_COORDINATES);
    } catch {
      return Object.keys(TERMINAL_COORDINATES);
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

  const setCurrentTerminal = (term) => {
    if (!term) return;
    setCurrentTerminalState(term);
    try {
      localStorage.setItem('vipcar_current_terminal', term);
    } catch (e) {
      console.warn('Error saving current terminal', e);
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

  const selectedVehicle = vehicles.find((v) => v.placa === selectedVehiclePlaca) || vehicles[0];

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

  const addCustomTerminal = (term) => {
    if (!term || availableTerminals.includes(term)) return;
    const updated = [...availableTerminals, term];
    setAvailableTerminals(updated);
    try {
      localStorage.setItem('vipcar_available_terminals', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom terminal', e);
    }
  };

  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('vipcar_vehicles', JSON.stringify(vehicles));
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
    conductor,
    ubicacion,
    latitud,
    longitud,
    precision,
    operacion,
  }) => {
    const targetPlaca = placa || selectedVehiclePlaca;
    const fuel = nivelCombustible ?? combustible ?? 75;
    const locData = ubicacion || (latitud != null && longitud != null ? { latitud, longitud, precision } : null);

    setVehicles((prev) =>
      prev.map((v) =>
        v.placa === targetPlaca
          ? {
              ...v,
              odometroActual: odometro,
              nivelCombustible: fuel,
              conductorActual: conductor || currentDriver,
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
      tipoRegistro: 'Check-in Turno Operativo',
      tipoEvento: 'Check-in',
      odometro,
      combustible: fuel,
      nivelCombustible: `${fuel}%`,
      checklist: checklist || null,
      checklistEstado: observaciones ? `Observaciones: ${observaciones}` : 'Aprobado sin incidencias',
      observaciones: observaciones || '',
      proyecto: operacion || currentTerminal,
      estado: 'OK',
      ubicacion: locData,
      latitud: locData?.latitud || null,
      longitud: locData?.longitud || null,
      precision: locData?.precision || null,
    };

    setBitacora((prev) => [nuevoRegistro, ...prev]);

    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'bitacora', nuevoRegistro.id), {
          ...nuevoRegistro,
          timestamp: new Date().toISOString(),
        });
        const vId = vehiculoId || vehicles.find((v) => v.placa === targetPlaca)?.id || 'veh-01';
        if (vId) {
          await updateDoc(doc(db, 'vehiculos', vId), {
            odometroActual: odometro,
            nivelCombustible: fuel,
            conductorActual: conductor || currentDriver,
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
    ubicacion,
    latitud,
    longitud,
    precision,
  }) => {
    const targetPlaca = placa || selectedVehiclePlaca;
    const finalOdo = odometroFinal ?? odometro;
    const finalFuel = nivelCombustibleFinal ?? combustible ?? 65;
    const locData = ubicacion || (latitud != null && longitud != null ? { latitud, longitud, precision } : null);

    setVehicles((prev) =>
      prev.map((v) =>
        v.placa === targetPlaca
          ? {
              ...v,
              odometroActual: finalOdo,
              nivelCombustible: finalFuel,
              conductorActual: conductor || currentDriver,
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
      tipoRegistro: 'Check-out Fin de Turno',
      tipoEvento: 'Check-out',
      odometro: finalOdo,
      combustible: finalFuel,
      nivelCombustible: `${finalFuel}%`,
      checklistEstado: novedades ? `Novedades: ${novedades}` : `Evaluación: ${evaluacion || 'Óptimo'} (+${kmRecorridos || 0} km)`,
      observaciones: novedades || `Evaluación: ${evaluacion || 'Óptimo'} (+${kmRecorridos || 0} km)`,
      evaluacion: evaluacion || 'Óptimo',
      proyecto: currentTerminal,
      estado: 'OK',
      ubicacion: locData,
      latitud: locData?.latitud || null,
      longitud: locData?.longitud || null,
      precision: locData?.precision || null,
    };

    setBitacora((prev) => [nuevoRegistro, ...prev]);

    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'bitacora', nuevoRegistro.id), {
          ...nuevoRegistro,
          timestamp: new Date().toISOString(),
        });
        const vId = vehiculoId || vehicles.find((v) => v.placa === targetPlaca)?.id || 'veh-01';
        if (vId) {
          await updateDoc(doc(db, 'vehiculos', vId), {
            odometroActual: finalOdo,
            nivelCombustible: finalFuel,
            conductorActual: conductor || currentDriver,
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
    foto,
    ubicacion,
    latitud,
    longitud,
    precision,
  }) => {
    const targetPlaca = placa || selectedVehiclePlaca;
    const locData = ubicacion || (latitud != null && longitud != null ? { latitud, longitud, precision } : null);

    setVehicles((prev) =>
      prev.map((v) =>
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

    const veh = vehicles.find((v) => v.placa === targetPlaca);

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
      tipoRegistro: `SOS Avería: ${tipoFalla} (${severidad})`,
      tipoEvento: 'SOS',
      odometro: veh?.odometroActual || 14750,
      combustible: veh?.nivelCombustible || 75,
      nivelCombustible: `${veh?.nivelCombustible || 75}%`,
      checklistEstado: descripcion,
      observaciones: descripcion,
      proyecto: currentTerminal,
      estado: 'Alerta',
      tipoFalla,
      severidad,
      descripcion,
      foto: foto || null,
      ubicacion: locData,
      latitud: locData?.latitud || null,
      longitud: locData?.longitud || null,
      precision: locData?.precision || null,
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
        const vId = vehiculoId || vehicles.find((v) => v.placa === targetPlaca)?.id || 'veh-01';
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
        bitacora,
        pendingSyncCount,
        currentDriver,
        setCurrentDriver,
        currentTerminal,
        setCurrentTerminal,
        selectedVehiclePlaca,
        setSelectedVehiclePlaca,
        selectedVehicle,
        availableDrivers,
        availableTerminals,
        addCustomDriver,
        addCustomTerminal,
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
    // Retornar fallback seguro en caso de renderizarse fuera del provider
    return {
      vehicles: INITIAL_VEHICLES,
      bitacora: INITIAL_BITACORA,
      pendingSyncCount: 0,
      currentDriver: 'Carlos Huamán',
      setCurrentDriver: () => {},
      currentTerminal: 'Terminal Huancayo',
      setCurrentTerminal: () => {},
      selectedVehiclePlaca: 'W4E-892',
      setSelectedVehiclePlaca: () => {},
      selectedVehicle: INITIAL_VEHICLES[0],
      availableDrivers: DEFAULT_DRIVERS,
      availableTerminals: Object.keys(TERMINAL_COORDINATES),
      addCustomDriver: () => {},
      addCustomTerminal: () => {},
      terminalCoordinates: TERMINAL_COORDINATES,
      sincronizarColaManual: () => {},
      registrarCheckIn: () => {},
      registrarCheckOut: () => {},
      reportarAveriaEmergencia: () => {},
    };
  }
  return context;
}
