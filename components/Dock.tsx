import React, { useState } from 'react';
import { InventoryContainer, Language, InventoryItem } from '../types';

interface DockProps {
  inventory: InventoryContainer[];
  language: Language;
  onDropItem?: (containerId: number, slotId: number) => void;
  onConsumeItem?: (containerId: number, slotId: number) => void; // Placeholder for future use
}

interface ItemActionMenuState {
  containerId: number;
  slotId: number;
  item: InventoryItem;
}

const Dock: React.FC<DockProps> = ({ inventory, language, onDropItem, onConsumeItem }) => {
  const [openContainerId, setOpenContainerId] = useState<number | null>(null);
  const [actionMenu, setActionMenu] = useState<ItemActionMenuState | null>(null);

  const toggleContainer = (id: number) => {
    if (openContainerId === id) {
      setOpenContainerId(null);
      setActionMenu(null);
    } else {
      setOpenContainerId(id);
      setActionMenu(null);
    }
  };

  const handleSlotClick = (containerId: number, slotId: number, item: InventoryItem | null) => {
    if (item) {
      setActionMenu({ containerId, slotId, item });
    }
  };

  const handleAction = (action: 'drop' | 'consume' | 'cancel') => {
    if (!actionMenu) return;
    
    if (action === 'drop' && onDropItem) {
      onDropItem(actionMenu.containerId, actionMenu.slotId);
    } else if (action === 'consume' && onConsumeItem) {
      // Future implementation
      console.log("Consuming item...");
    }
    
    setActionMenu(null);
  };

  const activeContainer = openContainerId !== null ? inventory[openContainerId] : null;

  return (
    <>
      {/* 6x6 Grid Modal for the Open Container */}
      {activeContainer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200 relative">
            
            {/* Item Action Context Menu (Overlay) */}
            {actionMenu && actionMenu.containerId === activeContainer.id && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl animate-in fade-in duration-150">
                <div className="bg-slate-800 border border-slate-500 p-4 rounded-lg shadow-2xl flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2 border-b border-slate-600 pb-2">
                     <img src={actionMenu.item.image} className="w-8 h-8 rounded bg-black object-cover" />
                     <span className="text-white font-bold text-sm">{actionMenu.item[language]}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleAction('consume')}
                    className="w-full text-left px-3 py-2 bg-emerald-900/50 hover:bg-emerald-700 text-emerald-100 rounded text-sm font-bold border border-emerald-900 transition-colors"
                  >
                    {language === 'pt' ? 'Consumir' : 'Consume'}
                  </button>

                  <button 
                    onClick={() => handleAction('drop')}
                    className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-bold border border-slate-600 transition-colors"
                  >
                    {language === 'pt' ? 'Soltar (No Chão)' : 'Drop (On Ground)'}
                  </button>

                  <button 
                    onClick={() => handleAction('cancel')}
                    className="w-full text-center mt-1 text-slate-400 hover:text-white text-xs uppercase tracking-widest py-1"
                  >
                    {language === 'pt' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <h3 className="text-white font-bold uppercase tracking-widest">
                {language === 'pt' ? `Container ${activeContainer.id + 1}` : `Container ${activeContainer.id + 1}`}
                <span className="text-slate-500 text-xs ml-2 normal-case">
                   ({activeContainer.slots.filter(s => s !== null).length}/36)
                </span>
              </h3>
              <button 
                onClick={() => setOpenContainerId(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* 6x6 Grid */}
            <div className="grid grid-cols-6 gap-2">
              {activeContainer.slots.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleSlotClick(activeContainer.id, index, item)}
                  className={`w-12 h-12 border rounded flex items-center justify-center relative group transition-all cursor-pointer
                    ${item 
                      ? 'bg-slate-800 border-slate-600 hover:border-blue-400 hover:bg-slate-700' 
                      : 'bg-slate-900/50 border-slate-800'
                    }`}
                >
                  {item ? (
                    <>
                      <img src={item.image} alt={item.en} className="w-10 h-10 object-cover rounded-sm" />
                      {item.quantity > 1 && (
                        <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-tl">
                          {item.quantity}
                        </span>
                      )}
                      {/* Tooltip (Only show if menu is not open) */}
                      {!actionMenu && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                          {item[language]}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-700 text-[9px]">{index + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Dock: 6 Container Slots */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className="flex items-end gap-4 pointer-events-auto bg-slate-900/80 backdrop-blur rounded-2xl p-3 border border-slate-700 shadow-2xl">
          {inventory.map((container) => {
            const filledCount = container.slots.filter(s => s !== null).length;
            const isOpen = openContainerId === container.id;
            
            return (
              <button
                key={container.id}
                onClick={() => toggleContainer(container.id)}
                className={`relative group flex flex-col items-center justify-center w-14 h-14 rounded-lg border transition-all duration-200
                  ${isOpen 
                    ? 'bg-blue-900/40 border-blue-500 scale-110 -translate-y-2' 
                    : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-400'
                  }`}
              >
                {/* Icon representing a crate/bag */}
                <div className="text-2xl">📦</div>
                
                {/* Slot Number */}
                <span className="absolute -top-2 -left-2 bg-slate-950 text-slate-400 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-slate-700 font-mono">
                  {container.id + 1}
                </span>

                {/* Capacity Bar */}
                <div className="absolute bottom-1 w-10 h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${filledCount >= 36 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${(filledCount / 36) * 100}%` }}
                  ></div>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-slate-600">
                  {language === 'pt' ? 'Depósito' : 'Storage'} {container.id + 1}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Dock;