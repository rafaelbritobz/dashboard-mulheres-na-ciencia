import React, { useMemo } from 'react';
import { Researcher, COLORS } from '../../lib/data-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, Cell } from 'recharts';
import { BrazilMap } from './BrazilMap';

export function TabOverview({ data }: { data: Researcher[] }) {
  const stats = useMemo(() => {
    const total = data.length;
    const women = data.filter(d => d.gender === 'Mulher').length;
    const men = data.filter(d => d.gender === 'Homem').length;
    const other = total - women - men;
    
    // Most common Institution
    const instCounts = data.reduce((acc, d) => {
      acc[d.institution] = (acc[d.institution] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topInst = Object.entries(instCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    // Most common Area
    const areaCounts = data.reduce((acc, d) => {
      acc[d.area] = (acc[d.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    return {
      total,
      womenPercent: total ? ((women / total) * 100).toFixed(1) : '0',
      menPercent: total ? ((men / total) * 100).toFixed(1) : '0',
      otherPercent: total ? ((other / total) * 100).toFixed(1) : '0',
      womenCount: women,
      menCount: men,
      otherCount: other,
      topInst: topInst[0],
      topInstCount: topInst[1],
      topArea: topArea[0],
      topAreaCount: topArea[1],
    };
  }, [data]);

  const genderByMacroArea = useMemo(() => {
    const counts: Record<string, { name: string, Mulher: number, Homem: number, Outro: number, Total: number }> = {};
    data.forEach(d => {
      const macroArea = d.macroArea || 'N/A';
      if (!counts[macroArea]) counts[macroArea] = { name: macroArea, Mulher: 0, Homem: 0, Outro: 0, Total: 0 };
      if (d.gender === 'Mulher') counts[macroArea].Mulher++;
      else if (d.gender === 'Homem') counts[macroArea].Homem++;
      else counts[macroArea].Outro++;
      counts[macroArea].Total++;
    });
    
    // Transform to percentages
    return Object.values(counts).map(c => ({
      name: c.name,
      Mulher_pct: Math.round((c.Mulher / c.Total) * 100),
      Homem_pct: Math.round((c.Homem / c.Total) * 100),
      Outro_pct: Math.round((c.Outro / c.Total) * 100),
      Total: c.Total
    })).sort((a, b) => b.Total - a.Total);
  }, [data]);

  const topStates = useMemo(() => {
    const counts: Record<string, { ufs: string, Mulher: number, Homem: number, Outro: number, Total: number }> = {};
    data.forEach(d => {
      const uf = d.uf || 'NI';
      if (!counts[uf]) counts[uf] = { ufs: uf, Mulher: 0, Homem: 0, Outro: 0, Total: 0 };
      if (d.gender === 'Mulher') counts[uf].Mulher++;
      else if (d.gender === 'Homem') counts[uf].Homem++;
      else counts[uf].Outro++;
      counts[uf].Total++;
    });
    return Object.values(counts)
      .filter(item => item.ufs !== 'Outros' && item.ufs !== 'NI')
      .sort((a, b) => b.Total - a.Total);
  }, [data]);

  const treemapData = useMemo(() => {
    const children = [
      { name: 'Mulheres', size: stats.womenCount, fill: COLORS.women },
      { name: 'Homens', size: stats.menCount, fill: COLORS.men },
    ];
    if (stats.otherCount > 0) {
      children.push({ name: 'Outros', size: stats.otherCount, fill: '#94a3b8' });
    }
    return [{ name: 'Gênero', children }];
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total de Bolsas</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Distribuição de Gênero</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: COLORS.women }}>{stats.womenPercent}%</span>
                <span className="text-xs text-slate-400 font-medium">({stats.womenCount.toLocaleString('pt-BR')})</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Mulher</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: COLORS.men }}>{stats.menPercent}%</span>
                <span className="text-xs text-slate-400 font-medium">({stats.menCount.toLocaleString('pt-BR')})</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Homem</span>
            </div>
            {stats.otherCount > 0 && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-400">{stats.otherPercent}%</span>
                  <span className="text-xs text-slate-400 font-medium">({stats.otherCount.toLocaleString('pt-BR')})</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Outros</span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Maior Instituição</p>
          <p className="text-xl font-bold text-slate-800 truncate" title={stats.topInst}>{stats.topInst}</p>
          <p className="text-sm text-slate-500">{stats.topInstCount} {stats.topInstCount === 1 ? 'bolsa no total' : 'bolsas no total'}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Principal Área</p>
          <p className="text-xl font-bold text-slate-800 truncate" title={stats.topArea}>{stats.topArea}</p>
          <p className="text-sm text-slate-500">{stats.topAreaCount} {stats.topAreaCount === 1 ? 'bolsa no total' : 'bolsas no total'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col min-h-[400px]">
           <h3 className="text-base font-bold text-slate-800 mb-1">Proporção Geral de Gênero</h3>
           <p className="text-sm text-slate-500 mb-6">Proporção total em todos os níveis e áreas da amostra filtrada.</p>
           <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  isAnimationActive={false}
                >
                  <Tooltip formatter={(v) => [v, 'Bolsistas']} contentStyle={{borderRadius: '8px'}}/>
                </Treemap>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col min-h-[400px]">
           <h3 className="text-base font-bold text-slate-800 mb-1">Gênero por Macroárea (100%)</h3>
           <p className="text-sm text-slate-500 mb-6">Composição relativa feminina e masculina em todas as macroáreas do conhecimento.</p>
           <div className="flex-1 w-full overflow-y-auto">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderByMacroArea} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={140} />
                    <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val) => [`${val}%`, '']} />
                    <Legend />
                    <Bar dataKey="Homem_pct" stackId="a" fill={COLORS.men} name="Homens (%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Mulher_pct" stackId="a" fill={COLORS.women} name="Mulheres (%)" radius={stats.otherCount > 0 ? [0, 0, 0, 0] : [0, 4, 4, 0]} />
                    {stats.otherCount > 0 && (
                      <Bar dataKey="Outro_pct" stackId="a" fill="#94a3b8" name="Outros (%)" radius={[0, 4, 4, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

       <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
           <h3 className="text-base font-bold text-slate-800 mb-1">Densidade Geográfica: Todos os Estados (UF)</h3>
           <p className="text-sm text-slate-500 mb-6">Volume total de bolsas e a divisão por gênero em ordem crescente, por todos os estados.</p>
           <style>{`
             .hide-max-y-line .recharts-cartesian-grid-horizontal line:last-child {
               display: none;
             }
           `}</style>
           <div className="w-full h-[400px] mt-4 hide-max-y-line">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStates} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="ufs" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} interval={0} angle={-45} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, dataMax => Math.ceil(dataMax * 1.05)]} tickFormatter={(value) => value > (topStates[0]?.Total || 0) ? '' : value} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                  <Legend wrapperStyle={{paddingTop: '30px'}} />
                  <Bar dataKey="Homem" stackId="a" fill={COLORS.menLight} name="Homens" maxBarSize={40} />
                  <Bar dataKey="Mulher" stackId="a" fill={COLORS.womenLight} name="Mulheres" radius={stats.otherCount > 0 ? [0, 0, 0, 0] : [4, 4, 0, 0]} maxBarSize={40} />
                  {stats.otherCount > 0 && (
                    <Bar dataKey="Outro" stackId="a" fill="#94a3b8" name="Outros" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  )}
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-1">Mapa de Pesquisadores por Região</h3>
            <p className="text-sm text-slate-500 mb-6">Total de bolsistas distribuídos pelas regiões geográficas do Brasil.</p>
            <BrazilMap data={data} />
        </div>

    </div>
  );
}
