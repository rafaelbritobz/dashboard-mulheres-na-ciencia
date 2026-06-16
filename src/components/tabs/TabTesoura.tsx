import React, { useMemo } from 'react';
import { Researcher, COLORS } from '../../lib/data-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function TabTesoura({ data }: { data: Researcher[] }) {
  const levelsOrdered = ['PQ-2', 'PQ-C', 'PQ-1D', 'PQ-1C', 'PQ-1B', 'PQ-1A', 'PQ-SR'];

  const metrics = useMemo(() => {
    const base = data.filter(d => d.levelGroup === 'Base (PQ-2, etc)');
    const topo = data.filter(d => d.level === 'PQ-1A' || d.level === 'PQ-SR');
    
    const wBase = base.filter(d => d.gender === 'Mulher').length;
    const pBase = base.length ? Math.round((wBase / base.length) * 100) : 0;

    const wTopo = topo.filter(d => d.gender === 'Mulher').length;
    const pTopo = topo.length ? Math.round((wTopo / topo.length) * 100) : 0;

    return { pBase, pTopo, dropoff: pBase - pTopo };
  }, [data]);

  const tesouraData = useMemo(() => {
    return levelsOrdered.map(level => {
      const levelData = data.filter(d => d.level === level);
      const total = levelData.length;
      if (!total) return null;
      const mulheres = levelData.filter(d => d.gender === 'Mulher').length;
      const homens = levelData.filter(d => d.gender === 'Homem').length;
      
      return {
        name: level,
        Mulheres: Math.round((mulheres / total) * 100),
        Homens: Math.round((homens / total) * 100),
        TotalAbsoluto: total
      };
    }).filter(Boolean);
  }, [data]);

  const heatmapData = useMemo(() => {
    // We want MacroArea (x) vs LevelGroup (y)
    const macroAreas = Array.from(new Set(data.map(d => d.macroArea))).filter(Boolean);
    const groups = ['Base (PQ-2, etc)', 'Topo (1A-1D)', 'Senior'];
    
    const grid: any[] = [];
    
    groups.forEach(group => {
      const row: any = { level: group };
      macroAreas.forEach(ma => {
        const subset = data.filter(d => d.levelGroup === group && d.macroArea === ma);
        const total = subset.length;
        const mulheres = subset.filter(d => d.gender === 'Mulher').length;
        const percent = total > 0 ? (mulheres / total) * 100 : 0;
        row[ma] = { percent, total, mulheres };
      });
      grid.push(row);
    });
    
    // revert grid so Top is at top visually
    return { macroAreas, grid: grid.reverse() };
  }, [data]);

  const getColorForHeatmap = (percent: number) => {
    if (percent === 0) return '#f1f5f9'; // empty
    if (percent >= 50) return COLORS.womenLight;
    if (percent >= 40) return '#c084fc'; // lighter purple
    if (percent >= 30) return '#94a3b8'; // neutral
    if (percent >= 20) return '#5eead4'; // lighter teal
    return COLORS.men; // heavily men
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mulheres na Base (PQ-2)</p>
          <p className="text-3xl font-bold" style={{ color: COLORS.women }}>{metrics.pBase}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mulheres no Topo (1A/SR)</p>
           <p className="text-3xl font-bold" style={{ color: COLORS.women }}>{metrics.pTopo}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Drop-off Feminino</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-slate-800">-{metrics.dropoff} pp</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-1">O Efeito Tesoura (Leaky Pipeline)</h3>
          <p className="text-sm text-slate-500 mb-6">Acompanhe a proporção de gênero escalando os níveis da carreira (da esquerda para a direita). Observe o ponto onde as curvas se cruzam.</p>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tesouraData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#475569', fontWeight: 600}} axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis unit="%" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value, name) => [`${value}%`, name]}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Line type="monotone" dataKey="Mulheres" stroke={COLORS.women} strokeWidth={4} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
                <Line type="monotone" dataKey="Homens" stroke={COLORS.men} strokeWidth={4} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-1">Mapa de Calor: Domínio Vertical x Horizontal</h3>
          <p className="text-sm text-slate-500 mb-6">Analise a participação feminina (em %) nos grupos de nível cruzados com as Macroáreas. Tons roxos indicam predominância ou paridade feminina, enquanto verdes escuros indicam dominância masculina.</p>
          
          <div className="overflow-x-auto pb-4">
             <div className="min-w-[600px]">
                <div className="grid grid-cols-[150px_1fr] gap-4">
                  <div></div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                    {heatmapData.macroAreas.map(ma => (
                      <div key={ma} className="flex-1 text-center truncate px-2">{ma}</div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 space-y-3">
                  {heatmapData.grid.map((row) => (
                    <div key={row.level} className="grid grid-cols-[150px_1fr] gap-4 items-center">
                      <div className="text-sm font-medium text-slate-700 text-right pr-4">{row.level}</div>
                      <div className="flex gap-2 h-16">
                        {heatmapData.macroAreas.map(ma => {
                          const cell = row[ma];
                          if (!cell) return <div key={ma} className="flex-1 bg-slate-50 rounded-lg"></div>;
                          return (
                            <div 
                              key={ma} 
                              className="flex-1 rounded-lg flex flex-col items-center justify-center text-white font-medium transition-all hover:opacity-90 hover:scale-[1.02] cursor-pointer"
                              style={{ backgroundColor: getColorForHeatmap(cell.percent) }}
                              title={`${ma} - ${row.level}\nMulheres: ${Math.round(cell.percent)}% (${cell.mulheres} de ${cell.total})`}
                            >
                              {cell.total > 0 && (
                                <>
                                  <span className="text-lg">{Math.round(cell.percent)}%</span>
                                  <span className="text-[10px] opacity-80 font-normal">n={cell.total}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
            <span>Dominância Masculina</span>
            <div className="flex h-3 rounded-full overflow-hidden w-64 border border-slate-200">
               <div className="flex-1" style={{backgroundColor: COLORS.men}}></div>
               <div className="flex-1" style={{backgroundColor: '#5eead4'}}></div>
               <div className="flex-1" style={{backgroundColor: '#94a3b8'}}></div>
               <div className="flex-1" style={{backgroundColor: '#c084fc'}}></div>
               <div className="flex-1" style={{backgroundColor: COLORS.womenLight}}></div>
            </div>
            <span>Paridade / Maioria Feminina</span>
          </div>
      </div>

    </div>
  );
}
