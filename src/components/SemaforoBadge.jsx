/* eslint-disable react-refresh/only-export-components */
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function calcularSemaforo(odometroActual = 0) {
  // Encuentra el siguiente múltiplo de 5000
  const siguienteServicio = Math.ceil((Number(odometroActual) + 1) / 5000) * 5000;
  const kmRestantes = siguienteServicio - Number(odometroActual);

  if (kmRestantes <= 0) {
    return {
      estado: 'Rojo',
      color: 'bg-[#2d0e14] text-[#ff6363] border-[#ff6363]/40',
      tag: 'Mantenimiento Vencido',
      siguienteServicio,
      kmRestantes,
      prioridad: 1,
    };
  } else if (kmRestantes <= 500) {
    return {
      estado: 'Amarillo',
      color: 'bg-[#231908] text-[#f59e0b] border-[#f59e0b]/40',
      tag: 'Mantenimiento Próximo',
      siguienteServicio,
      kmRestantes,
      prioridad: 2,
    };
  } else {
    return {
      estado: 'Verde',
      color: 'bg-[#071f16] text-[#59d499] border-[#59d499]/40',
      tag: 'Mantenimiento al Día',
      siguienteServicio,
      kmRestantes,
      prioridad: 3,
    };
  }
}

export default function SemaforoBadge({ odometro, compact = false }) {
  const semaforo = calcularSemaforo(odometro);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono border ${semaforo.color}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            semaforo.estado === 'Verde'
              ? 'bg-[#59d499]'
              : semaforo.estado === 'Amarillo'
              ? 'bg-[#f59e0b]'
              : 'bg-[#ff6363] animate-pulse'
          }`}
        />
        <span>{semaforo.estado}</span>
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${semaforo.color}`}>
      <div className="flex items-center gap-2.5">
        {semaforo.estado === 'Verde' && <CheckCircle className="w-4 h-4 text-[#59d499] shrink-0" />}
        {semaforo.estado === 'Amarillo' && <Clock className="w-4 h-4 text-[#f59e0b] shrink-0" />}
        {semaforo.estado === 'Rojo' && <AlertCircle className="w-4 h-4 text-[#ff6363] shrink-0" />}
        <div>
          <div className="text-xs font-medium uppercase font-mono tracking-wider">{semaforo.tag}</div>
          <div className="text-[11px] opacity-80 font-mono">
            {semaforo.kmRestantes > 0
              ? `Faltan ${semaforo.kmRestantes.toLocaleString()} km para servicio (${semaforo.siguienteServicio.toLocaleString()} km)`
              : `Excedido por ${Math.abs(semaforo.kmRestantes).toLocaleString()} km (servicio ${semaforo.siguienteServicio.toLocaleString()} km)`}
          </div>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono tracking-wider ${
            semaforo.estado === 'Verde'
              ? 'bg-[#071f16] text-[#59d499] border border-[#59d499]/40'
              : semaforo.estado === 'Amarillo'
              ? 'bg-[#231908] text-[#f59e0b] border border-[#f59e0b]/40'
              : 'bg-[#ff6363] text-black font-black shadow-xs'
          }`}
        >
          {semaforo.estado}
        </span>
      </div>
    </div>
  );
}
