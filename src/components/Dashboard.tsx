import React, { useState, useEffect, useMemo, useRef } from 'react';
import { parseData, Researcher, Filters } from '../lib/data-utils';
import { 
  BarChart2, Scissors, Network, Building2, Crown, Upload, 
  Filter, X
} from 'lucide-react';

import { TabOverview } from './tabs/TabOverview';
import { TabTesoura } from './tabs/TabTesoura';
import { TabDisciplinas } from './tabs/TabDisciplinas';
import { TabInstituicoes } from './tabs/TabInstituicoes';
import { TabElite } from './tabs/TabElite';

type TabId = 'overview' | 'tesoura' | 'disciplinas' | 'instituicoes' | 'elite';

export default function Dashboard() {
  const [data, setData] = useState<Researcher[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Filters>({
    genders: ['Mulher', 'Homem'],
    levels: [],
    macroArea: 'Todas',
    uf: 'Todas',
    institution: ''
  });

  useEffect(() => {
    parseData().then(parsedData => {
      setData(parsedData);
      setFilters(f => ({
        ...f,
        levels: Array.from(new Set(parsedData.map((d: any) => d.level)))
      }));
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseData(file).then(parsedData => {
        setData(parsedData);
        setFilters(f => ({
          ...f,
          levels: Array.from(new Set(parsedData.map((d: any) => d.level)))
        }));
      });
    }
  };

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    const ufs = new Set<string>();
    const macros = new Set<string>();
    const levels = new Set<string>();
    
    data.forEach(d => {
      ufs.add(d.uf);
      macros.add(d.macroArea);
      levels.add(d.level);
    });

    // Custom order for levels
    const levelOrder = ['PQ-2', 'PQ-', 'PQ-C', 'PQ-B', 'PQ-A', 'PQ-1D', 'PQ-1C', 'PQ-1B', 'PQ-1A', 'PQ-SR'];
    const availableLevels = Array.from(levels).sort((a, b) => {
      const idxA = levelOrder.indexOf(a);
      const idxB = levelOrder.indexOf(b);
      return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
    });

    return {
      ufs: Array.from(ufs).sort(),
      macros: Array.from(macros).sort(),
      levels: availableLevels
    };
  }, [data]);

  // Keep levels filter synced if data changes? Not strictly necessary if we rely on fixed levels or let user check.
  
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (!filters.genders.includes(d.gender)) return false;
      if (!filters.levels.includes(d.level)) return false;
      if (filters.macroArea !== 'Todas' && d.macroArea !== filters.macroArea) return false;
      if (filters.uf !== 'Todas' && d.uf !== filters.uf) return false;
      if (filters.institution && !d.institution.toLowerCase().includes(filters.institution.toLowerCase())) return false;
      return true;
    });
  }, [data, filters]);

  if (!data.length) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando painel...</div>;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar with Tabs and Filters */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-xl md:shadow-none`}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold tracking-tighter">PQ</div>
            <h1 className="font-bold text-slate-800 tracking-tight leading-tight">CNPq<br/><span className="text-xs text-slate-500 font-medium tracking-normal">Analytics Interativo</span></h1>
          </div>
          <button className="md:hidden text-slate-500 hover:text-slate-800" onClick={() => setIsMobileFiltersOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Tabs Navigation */}
          <nav className="p-4 space-y-1 border-b border-slate-200">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Visões</h2>
            <TabButton active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setIsMobileFiltersOpen(false)}} icon={<BarChart2 className="w-4 h-4"/>} label="Geral & Demografia" />
             <TabButton active={activeTab === 'tesoura'} onClick={() => {setActiveTab('tesoura'); setIsMobileFiltersOpen(false)}} icon={<Scissors className="w-4 h-4"/>} label="O Efeito Tesoura" />
             <TabButton active={activeTab === 'disciplinas'} onClick={() => {setActiveTab('disciplinas'); setIsMobileFiltersOpen(false)}} icon={<Network className="w-4 h-4"/>} label="Guetos Disciplinares" />
             <TabButton active={activeTab === 'instituicoes'} onClick={() => {setActiveTab('instituicoes'); setIsMobileFiltersOpen(false)}} icon={<Building2 className="w-4 h-4"/>} label="Poder Institucional" />
             <TabButton active={activeTab === 'elite'} onClick={() => {setActiveTab('elite'); setIsMobileFiltersOpen(false)}} icon={<Crown className="w-4 h-4"/>} label="A Elite da Pesquisa" />
          </nav>

          {/* Global Filters */}
          <div className="p-5 space-y-5 bg-slate-50/50 min-h-full">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Filter className="w-3 h-3" /> Filtros Globais</h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Gênero</label>
              <div className="flex flex-wrap gap-2">
                {['Homem', 'Mulher'].map(gender => {
                  const isSelected = filters.genders.includes(gender);
                  return (
                    <button
                      key={gender}
                      onClick={() => {
                        if (isSelected) setFilters(f => ({...f, genders: f.genders.filter(g => g !== gender)}));
                        else setFilters(f => ({...f, genders: [...f.genders, gender]}));
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                      {gender}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 mt-4">Nível da Bolsa</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.levels.map(level => {
                  const isSelected = filters.levels.includes(level);
                  return (
                    <button
                      key={level}
                      onClick={() => {
                        if (isSelected) setFilters(f => ({...f, levels: f.levels.filter(l => l !== level)}));
                        else setFilters(f => ({...f, levels: [...f.levels, level]}));
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <FilterSelect label="Macroárea" value={filters.macroArea} onChange={v => setFilters(f => ({...f, macroArea: v}))} options={['Todas', ...filterOptions.macros]} />
            <FilterSelect label="Estado (UF)" value={filters.uf} onChange={v => setFilters(f => ({...f, uf: v}))} options={['Todas', ...filterOptions.ufs]} />
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 mt-2">Instituição (Busca)</label>
              <input 
                type="text" 
                placeholder="Ex: USP, UFRJ..." 
                className="w-full text-sm border border-slate-300 rounded-md shadow-sm focus:border-slate-800 focus:ring-slate-800 py-2 px-3 outline-none"
                value={filters.institution}
                onChange={e => setFilters(f => ({...f, institution: e.target.value}))}
              />
            </div>

            <button 
              onClick={() => setFilters({genders: [], levels: [], macroArea: 'Todas', uf: 'Todas', institution: ''})}
              className="w-full py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-md hover:bg-white hover:text-slate-800 transition-colors mt-2"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800" onClick={() => setIsMobileFiltersOpen(true)}>
               <Filter className="w-5 h-5" />
             </button>
             <h2 className="font-semibold text-slate-800">
                {activeTab === 'overview' && 'Visão Geral e Demografia'}
                {activeTab === 'tesoura' && 'O Efeito Tesoura: Segregação Vertical'}
                {activeTab === 'disciplinas' && 'Guetos Disciplinares: Segregação Horizontal'}
                {activeTab === 'instituicoes' && 'Geografia e Poder Institucional'}
                {activeTab === 'elite' && 'A Elite da Pesquisa'}
             </h2>
             <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ml-2">
               {filteredData.length.toLocaleString('pt-BR')} registros
             </span>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <input type="file" accept=".csv, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
           <div className="max-w-6xl mx-auto h-full">
              {activeTab === 'overview' && <TabOverview data={filteredData} />}
              {activeTab === 'tesoura' && <TabTesoura data={filteredData} />}
              {activeTab === 'disciplinas' && <TabDisciplinas data={filteredData} />}
              {activeTab === 'instituicoes' && <TabInstituicoes data={filteredData} />}
              {activeTab === 'elite' && <TabElite data={filteredData} />}
           </div>
        </div>
      </main>

      {/* Overlay for mobile filters */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileFiltersOpen(false)}></div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active 
          ? 'bg-slate-900 text-white' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-slate-300' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-slate-800 focus:ring-slate-800 py-2 pl-3 pr-8 border outline-none bg-white"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
