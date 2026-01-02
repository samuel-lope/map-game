
import React, { useState, useRef, useMemo } from 'react';
import { PERIODIC_TABLE_DATA } from '../constants';
import { Language, PeriodicElement, PeriodicCategory, PeriodicTableData } from '../types';

interface PeriodicTableModalProps {
  onClose: () => void;
  language: Language;
}

// Helper to determine grid position based on Atomic Number
const getElementPosition = (n: number): { row: number; col: number } => {
  // Period 1
  if (n === 1) return { row: 1, col: 1 };
  if (n === 2) return { row: 1, col: 18 };
  
  // Period 2
  if (n >= 3 && n <= 4) return { row: 2, col: n - 2 };
  if (n >= 5 && n <= 10) return { row: 2, col: n + 8 };

  // Period 3
  if (n >= 11 && n <= 12) return { row: 3, col: n - 10 };
  if (n >= 13 && n <= 18) return { row: 3, col: n };

  // Period 4
  if (n >= 19 && n <= 36) return { row: 4, col: n - 18 };

  // Period 5
  if (n >= 37 && n <= 54) return { row: 5, col: n - 36 };

  // Period 6 (Lanthanides separated)
  if (n >= 55 && n <= 56) return { row: 6, col: n - 54 };
  if (n >= 72 && n <= 86) return { row: 6, col: n - 68 };

  // Period 7 (Actinides separated)
  if (n >= 87 && n <= 88) return { row: 7, col: n - 86 };
  if (n >= 104 && n <= 118) return { row: 7, col: n - 100 };

  // Lanthanides (Row 9) - Starting at Col 3 to visually align
  if (n >= 57 && n <= 71) return { row: 9, col: n - 54 }; 

  // Actinides (Row 10)
  if (n >= 89 && n <= 103) return { row: 10, col: n - 86 };

  return { row: 11, col: 1 }; // Fallback
};

const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({ onClose, language }) => {
  const [tableData, setTableData] = useState(PERIODIC_TABLE_DATA.tabela_periodica);
  const [selectedElement, setSelectedElement] = useState<PeriodicElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const langKey = language === 'pt' ? 'pt_BR' : 'en_US';

  // Helper to get category color
  const getCategoryColor = (catNameEn: string) => {
    // Colors matching standard conventions loosely
    if (catNameEn.includes("Alkali") && !catNameEn.includes("Earth")) return "bg-red-500/80 border-red-400 text-white"; // Group 1
    if (catNameEn.includes("Alkaline") || catNameEn.includes("Earth")) return "bg-orange-500/80 border-orange-400 text-white"; // Group 2
    if (catNameEn.includes("Transition")) return "bg-blue-500/80 border-blue-400 text-white"; // Groups 3-12
    if (catNameEn.includes("Lanthanide")) return "bg-pink-600/80 border-pink-400 text-white"; 
    if (catNameEn.includes("Actinide")) return "bg-purple-700/80 border-purple-500 text-white";
    if (catNameEn.includes("Metalloid") || catNameEn.includes("Semimetal")) return "bg-teal-600/80 border-teal-400 text-white";
    if (catNameEn.includes("Nonmetal") && !catNameEn.includes("Noble")) return "bg-green-600/80 border-green-400 text-white"; // Replaces specific logic
    if (catNameEn.includes("Noble")) return "bg-cyan-600/80 border-cyan-400 text-white";
    if (catNameEn.includes("Halogen")) return "bg-yellow-600/80 border-yellow-400 text-white";
    if (catNameEn.includes("Post-transition")) return "bg-indigo-400/80 border-indigo-300 text-white";
    
    return "bg-slate-700 border-slate-600 text-slate-300";
  };

  // Flatten elements for the grid view
  const allElements = useMemo(() => {
    const list: (PeriodicElement & { categoryNameEn: string })[] = [];
    tableData.categorias.forEach(cat => {
      cat.elementos.forEach(el => {
        list.push({ ...el, categoryNameEn: cat.nome.en_US });
      });
    });
    return list;
  }, [tableData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.tabela_periodica || !Array.isArray(json.tabela_periodica.categorias)) {
          alert(language === 'pt' ? "JSON inválido." : "Invalid JSON.");
          return;
        }
        const newCategories: PeriodicCategory[] = json.tabela_periodica.categorias;
        const currentCategories = [...tableData.categorias];
        let addedCount = 0;

        newCategories.forEach((newCat) => {
          const existingCatIndex = currentCategories.findIndex(c => c.nome.en_US === newCat.nome.en_US);
          if (existingCatIndex > -1) {
            const existingElements = [...currentCategories[existingCatIndex].elementos];
            let catChanged = false;
            newCat.elementos.forEach((newEl) => {
              if (!existingElements.some(el => el.numero_atomico === newEl.numero_atomico)) {
                existingElements.push(newEl);
                addedCount++;
                catChanged = true;
              }
            });
            if (catChanged) {
              existingElements.sort((a, b) => a.numero_atomico - b.numero_atomico);
              currentCategories[existingCatIndex] = { ...currentCategories[existingCatIndex], elementos: existingElements };
            }
          } else {
            currentCategories.push(newCat);
            addedCount += newCat.elementos.length;
          }
        });

        setTableData({ ...tableData, categorias: currentCategories });
        alert(language === 'pt' ? `${addedCount} importados.` : `${addedCount} imported.`);
      } catch (error) {
        console.error(error);
        alert("Error reading file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 shadow-md shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white tracking-widest flex items-center gap-3">
            <span className="text-3xl">⚛</span> 
            {language === 'pt' ? 'TABELA PERIÓDICA' : 'PERIODIC TABLE'}
            </h2>
            <div className="hidden md:block text-xs text-slate-500 border-l border-slate-700 pl-4">
                v{tableData.versao}
            </div>
        </div>

        <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
            <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-300 hover:text-white transition-colors bg-blue-900/30 hover:bg-blue-800/50 border border-blue-800 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
            >
            <span>📥</span> {language === 'pt' ? 'IMPORTAR' : 'IMPORT'}
            </button>
            <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-bold text-xs"
            >
            {language === 'pt' ? 'FECHAR' : 'CLOSE'} ✕
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center justify-start bg-slate-950">
        
        {/* Periodic Table Grid */}
        <div 
          className="grid gap-1 md:gap-2 auto-rows-[minmax(60px,1fr)] w-full max-w-[1400px]"
          style={{ 
            gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(10, auto)' // 7 periods + spacing + 2 lanthanides/actinides
          }}
        >
          {allElements.map((element) => {
            const pos = getElementPosition(element.numero_atomico);
            const colorClass = getCategoryColor(element.categoryNameEn);
            
            return (
              <button
                key={element.numero_atomico}
                onClick={() => setSelectedElement(element)}
                className={`
                  relative flex flex-col items-center justify-center p-1 rounded md:rounded-md border shadow-md transition-transform hover:scale-110 hover:z-10 cursor-pointer
                  ${colorClass}
                `}
                style={{
                  gridColumnStart: pos.col,
                  gridRowStart: pos.row,
                  aspectRatio: '1/1' // Maintain square boxes
                }}
              >
                <span className="absolute top-0.5 left-1 text-[8px] md:text-[10px] font-mono opacity-80">{element.numero_atomico}</span>
                <span className="text-sm md:text-xl font-bold">{element.simbolo}</span>
                <span className="text-[6px] md:text-[8px] truncate w-full text-center px-0.5">{element.nome[langKey]}</span>
              </button>
            );
          })}

          {/* Placeholders/Labels for Series (Optional visual guides) */}
          <div className="col-start-3 row-start-6 flex items-center justify-center border border-dashed border-slate-700 rounded text-slate-600 text-xs">57-71</div>
          <div className="col-start-3 row-start-7 flex items-center justify-center border border-dashed border-slate-700 rounded text-slate-600 text-xs">89-103</div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-5xl">
           {tableData.categorias.map((cat, idx) => (
             <div key={idx} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${getCategoryColor(cat.nome.en_US)}`}></div>
                <span className="text-xs text-slate-400 uppercase font-bold">{cat.nome[langKey]}</span>
             </div>
           ))}
        </div>

      </div>

      {/* --- ELEMENT DETAILS MODAL (Overlay) --- */}
      {selectedElement && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header/Top */}
            <div className="relative p-6 flex flex-col items-center border-b border-slate-800 bg-slate-950/50">
               <button 
                 onClick={() => setSelectedElement(null)}
                 className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
               >✕</button>

               <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 flex flex-col items-center justify-center rounded-xl border-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] ${getCategoryColor('Unknown') /* Dynamic would be better but requires passing category name */}`}>
                      <span className="text-xs self-start ml-2 mb-1 opacity-70">{selectedElement.numero_atomico}</span>
                      <span className="text-4xl font-bold">{selectedElement.simbolo}</span>
                  </div>
                  <div>
                      <h2 className="text-3xl font-bold text-white">{selectedElement.nome[langKey]}</h2>
                      <p className="text-blue-400 font-mono text-sm mt-1">{selectedElement.configuracao_eletronica}</p>
                      <span className="inline-block mt-2 bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300 uppercase tracking-widest border border-slate-700">
                        {selectedElement.estado_fisico_padrao}
                      </span>
                  </div>
               </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-700">
               
               {/* Electron Shells Visualization */}
               <div className="mb-6 flex flex-col items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">
                    {language === 'pt' ? 'Camadas Eletrônicas' : 'Electron Shells'}
                  </h4>
                  <div className="relative w-48 h-48 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-inner">
                    <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] z-10"></div>
                    {selectedElement.camadas.map((electrons, i) => {
                      const sizePercent = 20 + ((i + 1) / selectedElement.camadas.length) * 80;
                      return (
                        <div 
                          key={i}
                          className="absolute rounded-full border border-blue-500/30 flex items-center justify-center animate-[spin_slow_linear_infinite]"
                          style={{ 
                            width: `${sizePercent}%`, 
                            height: `${sizePercent}%`,
                            animationDuration: `${8 + i * 4}s`,
                            animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
                          }}
                        >
                          <div className="absolute top-0 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-3 font-mono text-sm text-blue-300">
                    {selectedElement.camadas.map((n, i) => (
                        <span key={i} className="bg-slate-800 px-2 rounded border border-slate-700">{n}</span>
                    ))}
                  </div>
               </div>

               {/* Data Grid */}
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Massa Atômica</div>
                    <div className="text-lg font-mono text-white">{selectedElement.massa_atomica} u</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Raio Atômico</div>
                    <div className="text-lg font-mono text-white">{selectedElement.estrutura_atomica.raio_atomico_pm || '-'} pm</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Eletronegatividade</div>
                    <div className="text-lg font-mono text-emerald-400">{selectedElement.estrutura_atomica.eletronegatividade_pauling || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700 flex gap-4">
                     <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">P</div>
                        <div className="text-white font-mono">{selectedElement.estrutura_atomica.protons}</div>
                     </div>
                     <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">N</div>
                        <div className="text-slate-400 font-mono">{selectedElement.estrutura_atomica.neutrons}</div>
                     </div>
                     <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">E</div>
                        <div className="text-blue-300 font-mono">{selectedElement.estrutura_atomica.eletrons}</div>
                     </div>
                  </div>
               </div>

               {/* Sources List */}
               <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest border-b border-slate-800 pb-1">
                    {language === 'pt' ? 'Onde Encontrar' : 'Where to Find'}
                  </h4>
                  <ul className="grid grid-cols-1 gap-1">
                    {selectedElement.fontes_naturais[langKey].map((source, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">▸</span> {source}
                      </li>
                    ))}
                  </ul>
               </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PeriodicTableModal;
