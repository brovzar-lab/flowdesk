import { useEffect, useState } from 'react';

export default function BlockingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
      <div className="bg-slate-900/95 border border-red-700/50 rounded-xl px-5 py-3 flex items-center gap-3 shadow-xl">
        <span className="text-lg">🚫</span>
        <p className="text-red-300 text-sm font-semibold">
          FlowDesk is blocking Twitter — stay in the zone
        </p>
      </div>
    </div>
  );
}
