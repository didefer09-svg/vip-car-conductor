import { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Buscar o seleccionar...',
  icon: Icon,
  id = 'searchable-select',
  helperText,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Normalizar opciones a { value, label, sublabel, badge }
  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt, sublabel: '', badge: '' };
      }
      return {
        value: opt.value || opt.placa || opt.id,
        label: opt.label || opt.placa || opt.nombre || opt.value,
        sublabel: opt.tipoDetalle || opt.sublabel || opt.detalle || '',
        badge: opt.codigo || opt.badge || opt.tipo || '',
      };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return (
      normalizedOptions.find((opt) => opt.value === value) ||
      normalizedOptions[0] || {
        value: value || '',
        label: value || 'Seleccionar...',
        sublabel: '',
        badge: '',
      }
    );
  }, [normalizedOptions, value]);

  const filteredOptions = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      return (
        opt.label.toLowerCase().includes(term) ||
        opt.value.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
        (opt.badge && opt.badge.toLowerCase().includes(term))
      );
    });
  }, [normalizedOptions, busqueda]);

  const handleSelect = (val) => {
    onChange(val);
    setAbierto(false);
    setBusqueda('');
  };

  return (
    <div className="space-y-1.5 w-full relative">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8e939e] flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-[#ff6363]" />}
            <span>{label}</span>
          </label>
          {selectedOption.badge && (
            <span className="text-[10px] font-mono font-bold text-[#ff6363] bg-[#ff6363]/10 px-2 py-0.5 rounded-full border border-[#ff6363]/30">
              {selectedOption.badge}
            </span>
          )}
        </div>
      )}

      {/* Botón Trigger Principal */}
      <button
        id={id}
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full bg-[#0a0c0e] hover:bg-[#111317] border border-white/[0.12] hover:border-[#ff6363]/50 focus:border-[#ff6363] rounded-2xl px-3.5 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer shadow-md group"
      >
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-bold text-white truncate font-mono">
            {selectedOption.label}
          </div>
          {selectedOption.sublabel && (
            <div className="text-[10px] text-[#8e939e] font-mono truncate mt-0.5">
              {selectedOption.sublabel}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-[#8e939e] group-hover:text-white transition-transform duration-200 ${
              abierto ? 'rotate-180 text-[#ff6363]' : ''
            }`}
          />
        </div>
      </button>

      {helperText && !abierto && (
        <p className="text-[10px] text-[#626773] font-mono px-1">{helperText}</p>
      )}

      {/* Menú Desplegable con Filtro Rápido */}
      {abierto && (
        <div className="fixed inset-x-4 top-24 bottom-6 sm:bottom-auto sm:top-auto sm:absolute sm:inset-x-0 sm:mt-1 z-50 bg-[#0e1115] border border-white/20 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] sm:max-h-80 overflow-hidden animate-in fade-in zoom-in-95 backdrop-blur-xl">
          {/* Cabecera del buscador */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-[#07080a]">
            <Search className="w-4 h-4 text-[#ff6363] shrink-0" />
            <input
              type="text"
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setBusqueda('');
              }}
              className="text-xs font-mono text-[#ff6363] hover:underline px-2 py-1 shrink-0 font-bold"
            >
              Cerrar
            </button>
          </div>

          {/* Lista de Opciones Filtradas */}
          <div className="overflow-y-auto divide-y divide-white/[0.04] p-1.5 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No se encontraron coincidencias para &quot;{busqueda}&quot;
              </div>
            ) : (
              (filteredOptions || []).map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#ff6363]/15 text-white border border-[#ff6363]/40'
                        : 'hover:bg-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold font-mono text-white flex items-center gap-2 flex-wrap">
                        <span>{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/40 text-[#ff6363] border border-[#ff6363]/30 font-bold">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#ff6363] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
