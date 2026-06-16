import React, { useMemo } from 'react';
import { Researcher, COLORS } from '../../lib/data-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Cell } from 'recharts';

export function TabDisciplinas({ data }: { data: Researcher[] }) {
  const areaStats = useMemo(() => {
    const areas: Record<string, { name: string, mulheres: number, homens: number, total: number }> = {};
    data.forEach(d => {
      if (!areas[d.area]) areas[d.area] = { name: d.area, mulheres: 0, homens: 0, total: 0 };
      areas[d.area].total++;
      if (d.gender === 'Mulher') areas[d.area].mulheres++;
      else if (d.gender === 'Homem') areas[d.area].homens++;
    });

    return Object.values(areas).map(a => ({
      ...a,
      pctMulheres: (a.mulheres / a.total) * 100,
      pctHomens: (a.homens / a.total) * 100
    })).filter(a => a.total > 5); // Exclude very small areas
  }, [data]);

  const metrics = useMemo(() => {
    const sorted = [...areaStats].sort((a, b) => b.pctMulheres - a.pctMulheres);
    const majorityWomen = sorted.filter(a => a.pctMulheres > 50).length;
    return {
      topFeminina: sorted[0] || { name: 'N/A', pctMulheres: 0 },
      topMasculina: sorted[sorted.length - 1] || { name: 'N/A', pctHomens: 0 },
      majorityWomen
    };
  }, [areaStats]);

  const top10Women = useMemo(() => {
    return [...areaStats].sort((a, b) => b.pctMulheres - a.pctMulheres).slice(0, 10);
  }, [areaStats]);

  const top10Men = useMemo(() => {
    return [...areaStats].sort((a, b) => a.pctMulheres - b.pctMulheres).slice(0, 10);
  }, [areaStats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Área Mais Feminina</p>
          <p className="text-xl font-bold text-slate-800 truncate" title={metrics.topFeminina.name}>{metrics.topFeminina.name}</p>
          <p className="text-sm font-medium" style={{ color: COLORS.women }}>{Math.round(metrics.topFeminina.pctMulheres)}% mulheres</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Área Mais Masculina</p>
           <p className="text-xl font-bold text-slate-800 truncate" title={metrics.topMasculina.name}>{metrics.topMasculina.name}</p>
          <p className="text-sm font-medium" style={{ color: COLORS.men }}>{Math.round(metrics.topMasculina.pctHomens)}% homens</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Maioria Feminina (&gt;50%)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.majorityWomen}</p>
            <p className="text-sm text-slate-500">áreas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-base font-bold text-slate-800 mb-1">Top 10: Concentração Feminina</h3>
          <p className="text-sm text-slate-500 mb-6">As áreas acadêmicas mais acolhedoras para as pesquisadoras.</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Women} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={160} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(val: number) => [`${Math.round(val)}%`, 'Mulheres']}
                />
                <Bar dataKey="pctMulheres" fill={COLORS.women} radius={[0, 4, 4, 0]}>
                  {top10Women.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.women} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-base font-bold text-slate-800 mb-1">Top 10: Dominância Masculina</h3>
          <p className="text-sm text-slate-500 mb-6">Ambientes disciplinares onde a presença feminina é extremamente rara.</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Men} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={160} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                   formatter={(val: number) => [`${Math.round(val)}%`, 'Mulheres']}
                />
                <Bar dataKey="pctMulheres" fill={COLORS.menLight} radius={[0, 4, 4, 0]}>
                  {top10Men.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.menLight} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-1">Dispersão: Volume vs Gênero</h3>
          <p className="text-sm text-slate-500 mb-6">Mapeamento de todas as áreas de estudo. Tente identificar padrões entre o tamanho da área e a diversidade.</p>
          <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="total" name="Total Bolsistas" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="pctMulheres" name="% Mulheres" unit="%" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                <ZAxis type="number" dataKey="total" range={[50, 600]} name="Volume" />
                <Tooltip 
                  cursor={{strokeDasharray: '3 3'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                           <p className="font-bold text-slate-800">{data.name}</p>
                           <p className="text-sm text-slate-600 mt-1">Total: {data.total}</p>
                           <p className="text-sm font-medium" style={{color: COLORS.women}}>Mulheres: {Math.round(data.pctMulheres)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Paridade (50%)', fill: '#64748b', fontSize: 12 }} />
                <Scatter data={areaStats} fill={COLORS.womenLight} opacity={0.7}>
                  {areaStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pctMulheres >= 50 ? COLORS.womenLight : COLORS.menLight} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
      </div>

    </div>
  );
}
