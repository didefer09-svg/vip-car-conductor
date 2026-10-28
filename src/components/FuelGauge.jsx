import { Fuel } from 'lucide-react';

export default function FuelGauge({ value = 75, onChange }) {
  // Cálculo de color dinámico y texto según el nivel
  let fuelColor = '#59d499';
  let fuelStatus = 'Nivel Óptimo';

  if (value <= 20) {
    fuelColor = '#ff6363';
    fuelStatus = 'Reserva Crítica';
  } else if (value <= 45) {
    fuelColor = '#f59e0b';
    fuelStatus = 'Nivel Bajo';
  } else if (value <= 70) {
    fuelColor = '#38bdf8';
    fuelStatus = 'Medio Tanque';
  }

  // Dimensiones del arco del tacómetro en semicírculo (Radio 70, perimetro semicirculo = PI * 70)
  const radius = 70;
  const circumference = Math.PI * radius; // ~219.9
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="telemetry-well p-4 sm:p-5 rounded-3xl flex flex-col items-center select-none border border-white/[0.08] space-y-3">
      {/* Tacómetro visual en arco SVG tradicional */}
      <div className="relative w-48 h-26 flex items-center justify-center">
        <svg viewBox="0 0 170 95" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="fuelGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff6363" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#59d499" />
            </linearGradient>
            <filter id="fuelGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Arco base de fondo */}
          <path
            d="M 15 85 A 70 70 0 0 1 155 85"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Arco activo iluminado con degradado de rojo a verde */}
          <path
            d="M 15 85 A 70 70 0 0 1 155 85"
            fill="none"
            stroke="url(#fuelGaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
            filter="url(#fuelGlow)"
          />

          {/* Marcadores de referencia tipo tacómetro */}
          <text x="12" y="93" fill="#ff6363" fontSize="10" fontFamily="monospace" fontWeight="bold">E</text>
          <text x="42" y="38" fill="#626773" fontSize="9" fontFamily="monospace">1/4</text>
          <text x="77" y="20" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">1/2</text>
          <text x="118" y="38" fill="#626773" fontSize="9" fontFamily="monospace">3/4</text>
          <text x="150" y="93" fill="#59d499" fontSize="10" fontFamily="monospace" fontWeight="bold">F</text>
        </svg>

        {/* Display central numérico */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" style={{ color: fuelColor }} />
            <span className="text-2xl font-mono font-black text-white tabular-nums tracking-tight">
              {value}%
            </span>
          </div>
          <span
            className="text-[9px] font-mono uppercase tracking-wider font-bold transition-colors"
            style={{ color: fuelColor }}
          >
            {fuelStatus}
          </span>
        </div>
      </div>

      {/* Control deslizante (input type='range' ancho y estilizado que pasa de rojo a verde) */}
      <div className="w-full space-y-2 pt-1">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(e) => onChange && onChange(Number(e.target.value))}
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none accent-white"
          style={{
            background: 'linear-gradient(to right, #ff6363 0%, #f59e0b 50%, #59d499 100%)',
          }}
        />

        <div className="flex justify-between items-center text-[10px] font-mono text-[#626773] px-1">
          <span className="flex items-center gap-1 text-[#ff6363]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6363]" />
            0% Vacío
          </span>
          <span className="text-zinc-500 hidden sm:inline">Desliza para ajustar</span>
          <span className="flex items-center gap-1 text-[#59d499]">
            100% Lleno
            <span className="w-1.5 h-1.5 rounded-full bg-[#59d499]" />
          </span>
        </div>
      </div>
    </div>
  );
}
