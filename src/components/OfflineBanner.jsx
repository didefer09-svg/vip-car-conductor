import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-[#101318]/95 border-b border-amber-500/40 text-amber-300 px-4 py-2 text-xs font-mono flex items-center justify-center gap-2 backdrop-blur-md shadow-lg transition-all animate-in slide-in-from-top duration-200"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="font-bold tracking-wide">
        Modo sin conexión activa
      </span>
      <span className="text-[11px] text-amber-200/70 hidden sm:inline">
        • La aplicación funciona offline y guardará tus datos
      </span>
    </aside>
  );
}
