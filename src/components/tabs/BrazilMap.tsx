import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "https://code.highcharts.com/mapdata/countries/br/br-all.topo.json";

export const REGIONS: Record<string, string> = {
  AC: 'Norte', AL: 'Nordeste', AP: 'Norte', AM: 'Norte', BA: 'Nordeste',
  CE: 'Nordeste', DF: 'Centro-Oeste', ES: 'Sudeste', GO: 'Centro-Oeste',
  MA: 'Nordeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste', MG: 'Sudeste',
  PA: 'Norte', PB: 'Nordeste', PR: 'Sul', PE: 'Nordeste', PI: 'Nordeste',
  RJ: 'Sudeste', RN: 'Nordeste', RS: 'Sul', RO: 'Norte', RR: 'Norte',
  SC: 'Sul', SP: 'Sudeste', SE: 'Nordeste', TO: 'Norte'
};

const REGION_COLORS: Record<string, string> = {
  'Norte': '#22c55e',      // Green
  'Nordeste': '#f59e0b',   // Amber
  'Centro-Oeste': '#ec4899', // Pink
  'Sudeste': '#3b82f6',    // Blue
  'Sul': '#8b5cf6',        // Purple
};

interface TooltipData {
  name: string;
  m: number;
  f: number;
  o: number;
  t: number;
  x: number;
  y: number;
}

export function BrazilMap({ data }: { data: any[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { regionStats, stateStats } = useMemo(() => {
    const rCounts: Record<string, number> = {
      'Norte': 0, 'Nordeste': 0, 'Centro-Oeste': 0, 'Sudeste': 0, 'Sul': 0
    };
    
    const sCounts: Record<string, { m: number, f: number, o: number, t: number }> = {};
    Object.keys(REGIONS).forEach(uf => {
      sCounts[uf] = { m: 0, f: 0, o: 0, t: 0 };
    });

    data.forEach(d => {
      const uf = d.uf;
      const region = REGIONS[uf];
      if (region) {
        rCounts[region]++;
      }
      if (sCounts[uf]) {
        if (d.gender === 'Homem') sCounts[uf].m++;
        else if (d.gender === 'Mulher') sCounts[uf].f++;
        else sCounts[uf].o++;
        sCounts[uf].t++;
      }
    });
    
    return { regionStats: rCounts, stateStats: sCounts };
  }, [data]);

  return (
    <div className="flex flex-col md:flex-row gap-6 relative">
      <div className="w-full md:w-2/3 min-h-[550px] border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 840,
            center: [-54, -15]
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // In deldersveld topojson, usually state id or name. 
                // We'll need to figure out what properties it holds.
                // Commonly it's `geo.properties.name` or `geo.id` (which is UF e.g., "BR.SP").
                const propStr = JSON.stringify(geo.properties || {});
                // Let's guess: "HASC_1": "BR.SP" or "id": "BR-SP"
                let uf = '';
                if (geo.properties && geo.properties['hc-a2']) {
                  uf = geo.properties['hc-a2'];
                } else if (geo.properties && geo.properties.HASC_1) {
                  uf = geo.properties.HASC_1.replace('BR.', '');
                } else if (geo.id && typeof geo.id === 'string' && geo.id.startsWith('BR-')) {
                   uf = geo.id.replace('BR-', '');
                } else if (geo.properties && geo.properties.SIGLA) {
                   uf = geo.properties.SIGLA;
                }
                
                // fallback mapping if it uses full name
                const ufNameMap: Record<string, string> = {
                   'Acre': 'AC', 'Alagoas': 'AL', 'Amapa': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
                   'Ceara': 'CE', 'Distrito Federal': 'DF', 'Espirito Santo': 'ES', 'Goias': 'GO',
                   'Maranhao': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
                   'Para': 'PA', 'Paraiba': 'PB', 'Parana': 'PR', 'Pernambuco': 'PE', 'Piaui': 'PI',
                   'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
                   'Rondonia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'Sao Paulo': 'SP',
                   'Sergipe': 'SE', 'Tocantins': 'TO'
                };
                if (!uf && geo.properties && geo.properties.name) {
                  const nameNorm = geo.properties.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  uf = ufNameMap[nameNorm] || '';
                }

                const region = REGIONS[uf];
                let color = "#e2e8f0";
                if (region) {
                   const count = regionStats[region];
                   // Could apply continuous scale based on count, but requirements say map separated by region.
                   // Let's just color by Region, and adjust opacity by density? No, just region color for clear separation.
                   color = REGION_COLORS[region] || "#e2e8f0";
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={1}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", opacity: 0.8 },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e) => {
                      const stats = stateStats[uf];
                      if (stats) {
                        setTooltip({
                          name: geo.properties.name || uf,
                          m: stats.m,
                          f: stats.f,
                          o: stats.o,
                          t: stats.t,
                          x: e.clientX,
                          y: e.clientY
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={() => {
                      setTooltip(null);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      
      {tooltip && (
        <div 
          className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg p-4 pointer-events-none text-sm transition-opacity" 
          style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}
        >
          <div className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100/80">{tooltip.name}</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-8 text-slate-600">
              <span>Mulheres:</span>
              <span className="font-semibold text-rose-600">{tooltip.f.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between gap-8 text-slate-600">
              <span>Homens:</span>
              <span className="font-semibold text-blue-600">{tooltip.m.toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <div className="flex justify-between gap-8 text-slate-900 mt-2 pt-2 border-t border-slate-100/80">
            <span className="font-semibold">Total:</span>
            <span className="font-bold">{tooltip.t.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      )}

      <div className="w-full md:w-1/3 flex flex-col justify-center gap-4">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">Totais por Região</h4>
        {['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map(region => (
           <div key={region} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 shadow-sm bg-white">
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REGION_COLORS[region] }}></div>
               <span className="font-semibold text-slate-700">{region}</span>
             </div>
             <span className="font-bold text-slate-900 text-lg">{regionStats[region]?.toLocaleString('pt-BR') || 0}</span>
           </div>
        ))}
      </div>
    </div>
  );
}
