
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { PERIODIC_TABLE_DATA } from '../constants';
import { Language, PeriodicElement, PeriodicCategory, PeriodicTableData } from '../types';

interface PeriodicTableModalProps {
  onClose: () => void;
  language: Language;
}

// Extend PeriodicElement to include the flattened category name for display purposes
type PeriodicElementDisplay = PeriodicElement & { categoryNameEn: string };

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
  const [selectedElement, setSelectedElement] = useState<PeriodicElementDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const langKey = language === 'pt' ? 'pt_BR' : 'en_US';

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://pub-76bc798090bb4086860a2e3286680ad5.r2.dev/periodic-table/tabela_periodica.json');
        if (!response.ok) throw new Error("Failed to load data");
        
        const json = await response.json();
        
        if (json.tabela_periodica) {
          setTableData(json.tabela_periodica);
        }
      } catch (error) {
        console.error("Error fetching periodic table data:", error);
        // Fallback or error handling could go here
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const getBorderColor = (catNameEn: string) => {
     const bgClass = getCategoryColor(catNameEn);
     if (bgClass.includes("red")) return "border-red-500";
     if (bgClass.includes("orange")) return "border-orange-500";
     if (bgClass.includes("blue")) return "border-blue-500";
     if (bgClass.includes("pink")) return "border-pink-500";
     if (bgClass.includes("purple")) return "border-purple-500";
     if (bgClass.includes("teal")) return "border-teal-500";
     if (bgClass.includes("green")) return "border-green-500";
     if (bgClass.includes("cyan")) return "border-cyan-500";
     if (bgClass.includes("yellow")) return "border-yellow-500";
     if (bgClass.includes("indigo")) return "border-indigo-500";
     return "border-slate-500";
  }

  // Flatten elements for the grid view
  const allElements = useMemo(() => {
    const list: PeriodicElementDisplay[] = [];
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
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center justify-start bg-slate-950 relative">
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-400 text-sm font-bold tracking-widest animate-pulse">LOADING DATA...</span>
            </div>
          </div>
        )}

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
        {!isLoading && (
          <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-5xl">
             {tableData.categorias.map((cat, idx) => (
               <div key={idx} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${getCategoryColor(cat.nome.en_US)}`}></div>
                  <span className="text-xs text-slate-400 uppercase font-bold">{cat.nome[langKey]}</span>
               </div>
             ))}
          </div>
        )}

      </div>

      {/* --- ELEMENT DETAILS MODAL (Overlay) --- */}
      {selectedElement && (
        <div 
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedElement(null)}
        >
          
          {/* Close button outside container */}
          <button 
             onClick={() => setSelectedElement(null)}
             className="absolute top-6 right-6 z-[120] w-12 h-12 flex items-center justify-center rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-600 shadow-xl backdrop-blur-sm"
          >
             <span className="text-2xl font-light">✕</span>
          </button>

          <div 
            className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Horizontal Layout for Widescreen */}
            <div className="flex flex-col md:grid md:grid-cols-[380px_1fr] h-full overflow-hidden">
                
                {/* LEFT: VISUALS (Atom Model) */}
                <div className="relative bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col items-center justify-center p-8 overflow-hidden">
                    
                    {/* Background Glow */}
                    <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-current ${getCategoryColor(selectedElement.categoryNameEn).split(' ')[0]}`}></div>

                    {/* ATOMIC MODEL ANIMATION */}
                    <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                        {/* Nucleus */}
                        <div className={`absolute w-6 h-6 rounded-full shadow-[0_0_20px_currentColor] z-10 ${getCategoryColor(selectedElement.categoryNameEn).split(' ')[0]} animate-pulse`}></div>
                        
                        {/* Electron Shells (Single rendering logic) */}
                        {selectedElement.camadas.map((electrons, i) => {
                            const sizePercent = 20 + ((i + 1) / selectedElement.camadas.length) * 80; // 20% to 100% of 256px
                            const radiusPx = (256 * (sizePercent/100)) / 2;
                            const duration = 6 + i * 4;
                            const direction = i % 2 === 0 ? 'normal' : 'reverse';

                            return (
                                <div 
                                    key={`shell-${i}`}
                                    className="absolute rounded-full border border-blue-500/20 flex items-center justify-center animate-[spin_linear_infinite]"
                                    style={{ 
                                        width: `${sizePercent}%`, 
                                        height: `${sizePercent}%`,
                                        animationDuration: `${duration}s`,
                                        animationDirection: direction
                                    }}
                                >
                                    {Array.from({ length: electrons }).map((_, eIdx) => (
                                        <div
                                            key={eIdx}
                                            className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"
                                            style={{
                                                transform: `rotate(${(360 / electrons) * eIdx}deg) translate(${radiusPx}px) rotate(-${(360 / electrons) * eIdx}deg)` 
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Identity Block */}
                    <div className="flex flex-col items-center z-10">
                        <div className={`text-6xl font-bold text-white mb-2 drop-shadow-xl ${getCategoryColor(selectedElement.categoryNameEn).split(' ')[2]}`}>
                            {selectedElement.simbolo}
                        </div>
                        <div className="text-3xl font-bold text-slate-200 text-center leading-none mb-1">
                            {selectedElement.nome[langKey]}
                        </div>
                        <div className="text-slate-500 font-mono font-bold text-lg mb-4">
                            {selectedElement.numero_atomico}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-widest border bg-slate-900/80 ${getBorderColor(selectedElement.categoryNameEn)} text-slate-300`}>
                            {selectedElement.categoryNameEn}
                        </span>
                    </div>
                </div>

                {/* RIGHT: DATA */}
                <div className="flex flex-col p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 bg-slate-900">
                    
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-800 p-3 rounded border border-slate-700 overflow-hidden">
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 truncate">Massa Atômica</div>
                            <div className="text-white font-mono text-sm md:text-base truncate" title={`${selectedElement.massa_atomica} u`}>
                                {selectedElement.massa_atomica} <span className="text-xs text-slate-500">u</span>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded border border-slate-700 overflow-hidden">
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 truncate">Estado Físico</div>
                            <div className="text-white text-sm md:text-base truncate" title={selectedElement.estado_fisico_padrao}>
                                {selectedElement.estado_fisico_padrao}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded border border-slate-700 overflow-hidden">
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 truncate">Eletronegatividade</div>
                            <div className="text-emerald-400 font-mono text-sm md:text-base truncate">
                                {selectedElement.estrutura_atomica.eletronegatividade_pauling || 'N/A'}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded border border-slate-700 overflow-hidden">
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 truncate">Raio Atômico</div>
                            <div className="text-blue-400 font-mono text-sm md:text-base truncate">
                                {selectedElement.estrutura_atomica.raio_atomico_pm || '-'} <span className="text-xs text-slate-500">pm</span>
                            </div>
                        </div>
                    </div>

                    {/* Electronic Config */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest border-b border-slate-800 pb-1">
                            {language === 'pt' ? 'Estrutura Eletrônica' : 'Electronic Structure'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="font-mono text-2xl text-yellow-400 bg-slate-950/50 px-4 py-2 rounded border border-yellow-900/30">
                                {selectedElement.configuracao_eletronica}
                            </div>
                            <div className="flex gap-1">
                                {selectedElement.camadas.map((n, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded border border-slate-700 text-blue-300 font-mono font-bold text-sm">
                                            {n}
                                        </div>
                                        <span className="text-[9px] text-slate-600 mt-1">K{i+1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Particles */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                         <div className="bg-slate-800/50 p-4 rounded border border-slate-700 flex flex-col items-center">
                            <span className="text-2xl mb-1">🔴</span>
                            <div className="text-2xl font-bold text-white">{selectedElement.estrutura_atomica.protons}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Prótons</div>
                         </div>
                         <div className="bg-slate-800/50 p-4 rounded border border-slate-700 flex flex-col items-center">
                            <span className="text-2xl mb-1">⚪</span>
                            <div className="text-2xl font-bold text-slate-300">{selectedElement.estrutura_atomica.neutrons}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Nêutrons</div>
                         </div>
                         <div className="bg-slate-800/50 p-4 rounded border border-slate-700 flex flex-col items-center">
                            <span className="text-2xl mb-1">🔵</span>
                            <div className="text-2xl font-bold text-blue-300">{selectedElement.estrutura_atomica.eletrons}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Elétrons</div>
                         </div>
                    </div>

                    {/* Sources */}
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest border-b border-slate-800 pb-1">
                            {language === 'pt' ? 'Fontes Naturais' : 'Natural Sources'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedElement.fontes_naturais[langKey].map((source, i) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 border border-slate-700 transition-colors">
                                    {source}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PeriodicTableModal;
