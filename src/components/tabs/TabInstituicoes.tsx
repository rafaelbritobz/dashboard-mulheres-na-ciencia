import React, { useMemo, useState } from 'react';
import { Researcher, COLORS } from '../../lib/data-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';
import { ChevronRight, ChevronDown } from 'lucide-react';

export function TabInstituicoes({ data }: { data: Researcher[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInsts, setExpandedInsts] = useState<Record<string, boolean>>({});
  const [expandedMacroAreas, setExpandedMacroAreas] = useState<Record<string, boolean>>({});

  const toggleInst = (name: string) => {
    setExpandedInsts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleMacroArea = (instName: string, macroAreaName: string) => {
    const key = `${instName}-${macroAreaName}`;
    setExpandedMacroAreas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const instStats = useMemo(() => {
    const insts: Record<string, { 
      name: string, 
      mulheres: number, 
      homens: number, 
      total: number, 
      macroAreas: Record<string, any> 
    }> = {};
    
    data.forEach(d => {
      // Clean up string slightly if needed
      const name = d.institution || 'Desconhecida';
      const macroArea = d.macroArea || 'Desconhecida';
      const area = d.area || 'Desconhecida';
      
      if (!insts[name]) insts[name] = { name, mulheres: 0, homens: 0, total: 0, macroAreas: {} };
      if (!insts[name].macroAreas[macroArea]) insts[name].macroAreas[macroArea] = { name: macroArea, mulheres: 0, homens: 0, total: 0, areas: {} };
      if (!insts[name].macroAreas[macroArea].areas[area]) insts[name].macroAreas[macroArea].areas[area] = { name: area, mulheres: 0, homens: 0, total: 0 };
      
      insts[name].total++;
      insts[name].macroAreas[macroArea].total++;
      insts[name].macroAreas[macroArea].areas[area].total++;
      
      if (d.gender === 'Mulher') {
        insts[name].mulheres++;
        insts[name].macroAreas[macroArea].mulheres++;
        insts[name].macroAreas[macroArea].areas[area].mulheres++;
      }
      else if (d.gender === 'Homem') {
        insts[name].homens++;
        insts[name].macroAreas[macroArea].homens++;
        insts[name].macroAreas[macroArea].areas[area].homens++;
      }
    });

    return Object.values(insts).map(i => ({
      ...i,
      pctMulheres: (i.mulheres / i.total) * 100,
      pctHomens: (i.homens / i.total) * 100,
      macroAreasArray: Object.values(i.macroAreas).sort((a: any, b: any) => b.total - a.total).map((ma: any) => ({
        ...ma,
        pctMulheres: ma.total > 0 ? (ma.mulheres / ma.total) * 100 : 0,
        pctHomens: ma.total > 0 ? (ma.homens / ma.total) * 100 : 0,
        areasArray: Object.values(ma.areas).sort((a: any, b: any) => b.total - a.total).map((a: any) => ({
          ...a,
          pctMulheres: a.total > 0 ? (a.mulheres / a.total) * 100 : 0,
          pctHomens: a.total > 0 ? (a.homens / a.total) * 100 : 0
        }))
      }))
    })).filter(i => i.total >= 5);
  }, [data]);

  const metrics = useMemo(() => {
    // Only consider larger institutions for parity metrics
    const largeInsts = instStats.filter(i => i.total > 50);
    if (!largeInsts.length) return { bestParity: 'N/A', worstGap: 'N/A', topUf: 'N/A' };
    
    // Best parity: closest to 50%
    const best = [...largeInsts].sort((a,b) => Math.abs(a.pctMulheres - 50) - Math.abs(b.pctMulheres - 50))[0];
    // Worst gap: highest absolute difference from 50%
    const worst = [...largeInsts].sort((a,b) => Math.abs(b.pctMulheres - 50) - Math.abs(a.pctMulheres - 50))[0];

    const ufs = data.reduce((acc, d) => {
      acc[d.uf] = (acc[d.uf] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topUf = Object.entries(ufs).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0];

    return { 
      bestParity: best.name, 
      worstGap: worst.name, 
      topUf: topUf[0],
      topUfCount: topUf[1]
    };
  }, [instStats, data]);

  const tornadoData = useMemo(() => {
    return [...instStats].sort((a, b) => b.total - a.total).slice(0, 15).map(i => ({
      name: i.name,
      Mulheres: i.mulheres,
      Homens: -i.homens, // Negative for left side of tornado
      Total: i.total
    }));
  }, [instStats]);

  const radialUfData = useMemo(() => {
    const ufs: Record<string, number> = {};
    data.forEach(d => {
      if(d.uf === 'Outros') return;
      ufs[d.uf] = (ufs[d.uf] || 0) + 1;
    });
    return Object.entries(ufs)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value], i) => ({
        name, 
        value,
        fill: i === 0 ? '#3b82f6' : '#94a3b8' // Highlight top with blue, others gray
      }));
  }, [data]);

  const filteredInsts = useMemo(() => {
    return [...instStats]
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.total - a.total);
  }, [instStats, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Melhor Paridade (&gt;50 vols)</p>
          <p className="text-xl font-bold text-slate-800 truncate" title={metrics.bestParity}>{metrics.bestParity}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Maior Fosso de Gênero</p>
           <p className="text-xl font-bold text-slate-800 truncate" title={metrics.worstGap}>{metrics.worstGap}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Polo Geopolítico</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.topUf}</p>
            <p className="text-lg text-slate-500">({metrics.topUfCount} bolsas)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col min-h-[500px] lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-1">Poder Institucional (Top 15)</h3>
          <p className="text-sm text-slate-500 mb-6">As instituições formadoras e detentoras do maior volume financeiro e de bolsas.</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tornadoData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={160} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(val: number) => [Math.abs(val), val > 0 ? 'Mulheres' : 'Homens']}
                />
                <Legend />
                <Bar dataKey="Homens" fill={COLORS.men} stackId="stack" />
                <Bar dataKey="Mulheres" fill={COLORS.women} stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col min-h-[500px] lg:col-span-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">Concentração por UF</h3>
          <p className="text-sm text-slate-500 mb-6">A esmagadora dominância concentrada nos principais estados do país.</p>
          <div className="flex-1 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" data={radialUfData} startAngle={90} endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={10} />
                  <Legend iconSize={10} layout="vertical" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{borderRadius: '8px'}} formatter={(val: number) => [`${val} bolsas`, 'Volume']} />
                </RadialBarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Diretório de Instituições</h3>
              <p className="text-sm text-slate-500">Lista completa com divisões de gênero intra-institucionais.</p>
            </div>
            <input 
              type="text" 
              placeholder="Buscar instituição..." 
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-slate-800 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Instituição</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">Total Bolsas</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Divisão M/F</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInsts.slice(0, 15).map(inst => (
                  <React.Fragment key={inst.name}>
                    <tr onClick={() => toggleInst(inst.name)} className="hover:bg-slate-50 transition-colors cursor-pointer group/row">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          {expandedInsts[inst.name] ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover/row:text-slate-600 transition-colors" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover/row:text-slate-600 transition-colors" />
                          )}
                          {inst.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{inst.total}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="group relative w-48 h-2 bg-slate-100 rounded-full flex cursor-help">
                            <div style={{width: `${inst.pctMulheres}%`, backgroundColor: COLORS.women}} className="h-full rounded-l-full"></div>
                            <div style={{width: `${inst.pctHomens}%`, backgroundColor: COLORS.menLight}} className="h-full rounded-r-full"></div>
                            
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded-md p-2 -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg z-10 pointer-events-none">
                              Mulheres: {inst.mulheres} ({Math.round(inst.pctMulheres)}%) | Homens: {inst.homens} ({Math.round(inst.pctHomens)}%)
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedInsts[inst.name] && (
                      <tr>
                        <td colSpan={3} className="bg-slate-50/50 p-4 m-0 border-b border-slate-200 shadow-inner">
                          <div className="px-2 sm:px-6 py-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pesquisas por Macroárea e Área</h4>
                            <div className="flex flex-col rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                              {inst.macroAreasArray.map((ma: any, maIndex: number) => (
                                <div key={ma.name} className={`flex flex-col ${maIndex > 0 ? 'border-t border-slate-100' : ''}`}>
                                  <div 
                                    onClick={() => toggleMacroArea(inst.name, ma.name)}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors group/ma gap-2 sm:gap-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1 rounded-md transition-colors ${expandedMacroAreas[`${inst.name}-${ma.name}`] ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400 group-hover/ma:text-indigo-500 group-hover/ma:bg-indigo-50'}`}>
                                        {expandedMacroAreas[`${inst.name}-${ma.name}`] ? (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                      </div>
                                      <span className="font-medium text-sm text-slate-700">{ma.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-10 sm:pl-0">
                                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full min-w-[3rem] text-center">{ma.total} bolsas</span>
                                      
                                      <div className="group relative w-32 h-2 bg-slate-100 rounded-full flex cursor-help">
                                        <div style={{width: `${ma.pctMulheres}%`, backgroundColor: COLORS.women}} className="h-full rounded-l-full"></div>
                                        <div style={{width: `${ma.pctHomens}%`, backgroundColor: COLORS.menLight}} className="h-full rounded-r-full"></div>
                                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded-md p-1.5 -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg z-10 pointer-events-none">
                                          Mulheres: {ma.mulheres} ({Math.round(ma.pctMulheres)}%) | Homens: {ma.homens} ({Math.round(ma.pctHomens)}%)
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {expandedMacroAreas[`${inst.name}-${ma.name}`] && (
                                    <div className="flex flex-col bg-slate-50/70 border-t border-slate-100 px-3 sm:px-5 py-2">
                                      {ma.areasArray.map((area: any) => (
                                        <div key={area.name} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-2.5 pl-4 border-l-2 border-slate-200 ml-2 sm:ml-4 hover:border-slate-300 transition-colors group/area gap-1 sm:gap-4">
                                          <div className="flex items-center gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/area:bg-slate-400 transition-colors"></div>
                                             <span className="text-xs font-medium text-slate-600">{area.name}</span>
                                          </div>
                                          
                                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-6 sm:pl-0">
                                            <span className="text-xs font-medium text-slate-500 w-12 text-right pr-2">{area.total}</span>
                                            
                                            <div className="group relative w-24 h-1.5 bg-slate-200 rounded-full flex cursor-help opacity-80 hover:opacity-100 transition-opacity">
                                              <div style={{width: `${area.pctMulheres}%`, backgroundColor: COLORS.women}} className="h-full rounded-l-full"></div>
                                              <div style={{width: `${area.pctHomens}%`, backgroundColor: COLORS.menLight}} className="h-full rounded-r-full"></div>
                                              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded-md p-1.5 -top-8 right-0 sm:left-1/2 sm:-translate-x-1/2 whitespace-nowrap shadow-lg z-10 pointer-events-none">
                                                Mulheres: {area.mulheres} ({Math.round(area.pctMulheres)}%) | Homens: {area.homens} ({Math.round(area.pctHomens)}%)
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {filteredInsts.length > 15 && (
              <p className="text-center text-xs text-slate-400 mt-4 italic">Mostrando 15 de {filteredInsts.length} resultados. Use a busca para filtrar.</p>
            )}
          </div>
      </div>

    </div>
  );
}
