import React from 'react';
import { LocalizedName, Language } from '../types';

interface DockProps {
  items: LocalizedName[];
  language: Language;
}

const Dock: React.FC<DockProps> = ({ items, language }) => {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
      {/* Container background removed. Added pointer-events-auto to children wrapper so interactions still work. */}
      <div className="flex items-end gap-3 pointer-events-auto">
        
        {items.map((item, index) => (
          <div 
            key={`${item.en}-${index}`} 
            className="group relative flex flex-col items-center transition-all duration-300 hover:-translate-y-2 hover:scale-105"
          >
            {/* Tooltip */}
            <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none mb-2 border border-blue-500/30 shadow-xl tracking-wide uppercase z-50 backdrop-blur-sm">
              {item[language]}
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-blue-500/30 transform rotate-45"></div>
            </div>
            
            {/* Icon/Image Container */}
            {/* Increased opacity/contrast of the individual item box since the main dock background is gone */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-slate-900/90 backdrop-blur-md border border-slate-600 shadow-lg group-hover:shadow-blue-500/50 group-hover:border-blue-400 transition-all relative">
               {item.image ? (
                 <img src={item.image} alt={item.en} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-2xl text-slate-600">
                    ?
                 </div>
               )}
               {/* Subtle Scanline/Glass effect overlay */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"></div>
            </div>
            
            {/* Active Indicator (Sci-fi bar style) */}
            <div className="w-8 h-0.5 bg-blue-500/50 rounded-full mt-2 opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dock;