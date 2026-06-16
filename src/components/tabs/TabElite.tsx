import React, { useMemo } from 'react';
import { Researcher, COLORS } from '../../lib/data-utils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Cell } from 'recharts';

export function TabElite({ data }: { data: Researcher[] }) {
  const eliteData = useMemo(() => {
    return data.filter(d => d.level === 'PQ-1A' || d.level === 'PQ-SR');
  }, [data]);

  const metrics = useMemo(() => {
    const total = eliteData.length;
    const mulheres = eliteData.filter(d => d.gender === 'Mulher').length;
    const pctMulheres = total ? (mulheres / total) * 100 : 0;

    const ufs = eliteData.reduce((acc, d) => {
      acc[d.uf] = (acc[d.uf] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topUf = Object.entries(ufs).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0];

    return { total, pctMulheres, topUf: topUf[0], topUfCount: topUf[1] };
  }, [eliteData]);

  const paretoData = useMemo(() => {
    const areas = eliteData.reduce((acc, d) => {
      acc[d.area] = (acc[d.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedAreas = Object.entries(areas)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    let acumulado = 0;
    const total = sortedAreas.reduce((sum, a) => sum + a.count, 0);

    return sortedAreas.slice(0, 20).map(a => {
      acumulado += a.count;
      return {
        name: a.name,
        Bolsas: a.count,
        Acumulado: parseFloat(((acumulado / total) * 100).toFixed(1))
      };
    });
  }, [eliteData]);

  const groupedBarData = useMemo(() => {
    const groups: Record<string, Record<string, { name: string, mulheres: number, homens: number, total: number }>> = {};
    
    eliteData.forEach(d => {
      const ma = d.macroArea || 'Outras';
      const area = d.area || 'Outras';
      if (!groups[ma]) groups[ma] = {};
      if (!groups[ma][area]) {
        groups[ma][area] = { name: area, mulheres: 0, homens: 0, total: 0 };
      }
      groups[ma][area].total++;
      if (d.gender === 'Mulher') groups[ma][area].mulheres++;
      else if (d.gender === 'Homem') groups[ma][area].homens++;
    });

    const result: Array<{
      macroArea: string;
      areas: Array<{
        name: string;
        Mulheres: number;
        Homens: number;
        total: number;
      }>;
    }> = [];

    Object.entries(groups).forEach(([maName, areasObj]) => {
      const sortedAreas = Object.values(areasObj)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(a => ({
          name: a.name,
          Mulheres: a.mulheres,
          Homens: a.homens,
          total: a.total
        }));
      result.push({
        macroArea: maName,
        areas: sortedAreas
      });
    });

    return result;
  }, [eliteData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-800 rounded-full opacity-50"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 relative z-10">Total de Pesquisadores na Elite</p>
          <p className="text-3xl font-bold relative z-10">{metrics.total.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">% Mulheres na Elite</p>
           <p className="text-3xl font-bold" style={{ color: COLORS.women }}>{Math.round(metrics.pctMulheres)}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">UF Dominante na Elite</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800">{metrics.topUf}</p>
            <p className="text-lg text-slate-500">({metrics.topUfCount} bolsas)</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-1">Concentração Elite: Princípio de Pareto</h3>
          <p className="text-sm text-slate-500 mb-6">A linha mostra a % acumulada. Observe como poucas áreas detêm a vasta maioria das bolsas de maior prestígio do CNPq.</p>
          <div className="w-full h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 11}} axisLine={false} tickLine={false} />
                 <YAxis yAxisId="left" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <YAxis yAxisId="right" orientation="right" unit="%" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                 <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                   formatter={(value: any, name: string) => {
                     if (name === 'Acumulado') return [`${Number(value).toFixed(1)}%`, 'Acumulado'];
                     return [value.toLocaleString('pt-BR'), name];
                   }}
                 />
                 <Bar yAxisId="left" dataKey="Bolsas" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 <Line yAxisId="right" type="monotone" dataKey="Acumulado" stroke="#ec4899" strokeWidth={3} dot={{r: 4}} />
               </ComposedChart>
             </ResponsiveContainer>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-1">Distribuição da Elite por Campos do Conhecimento</h3>
          <p className="text-sm text-slate-500 mb-6">Top 5 disciplinas com mais bolsas de elite em cada Macroárea, destacando a disparidade de gênero.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {groupedBarData.map(group => (
              <div key={group.macroArea} className="flex flex-col min-h-[300px] border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200/50 pb-2">{group.macroArea}</h4>
                <div className="flex-1 w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={group.areas} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={110} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#475569', fontSize: 10, fontWeight: 'medium'}} 
                        tickFormatter={(name: string) => name.length > 18 ? `${name.substring(0, 15)}...` : name}
                      />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        formatter={(val: number, name: string) => [`${val} bolsas`, name]}
                      />
                      <Bar dataKey="Homens" fill={COLORS.men} stackId="a" />
                      <Bar dataKey="Mulheres" fill={COLORS.women} stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
      </div>

    </div>
  );
}
