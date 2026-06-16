import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import rawData from '../data.csv?raw';

export interface Researcher {
  area: string;
  name: string;
  gender: string;
  level: string;
  institution: string;
  uf: string;
  macroArea: string;
  levelGroup: string;
}

export interface Filters {
  genders: string[];
  levels: string[];
  macroArea: string;
  uf: string;
  institution: string;
}

const UF_LIST = new Set(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]);

const EXTRACT_UF = (inst: string): string => {
  if (!inst) return 'NI';
  const upper = inst.toUpperCase();
  const match = upper.match(/UF([A-Z]{2})/);
  if (match && UF_LIST.has(match[1])) return match[1];
  if (upper.includes('USP') || upper.includes('UNICAMP') || upper.includes('UNESP') || upper.includes('UFSCAR')) return 'SP';
  if (upper.includes('UFRJ') || upper.includes('FIOCRUZ') || upper.includes('PUC-RIO') || upper.includes('UFF')) return 'RJ';
  if (upper.includes('UFMG') || upper.includes('UFV') || upper.includes('PUC MINAS') || upper.includes('UFU')) return 'MG';
  if (upper.includes('UFRGS') || upper.includes('PUCRS') || upper.includes('UFSM') || upper.includes('UFPEL')) return 'RS';
  if (upper.includes('UFPE') || upper.includes('UFPR') || upper.includes('UFBA') || upper.includes('UFC') || upper.includes('UFSC') || upper.includes('UFMA')) {
    const maybeUf = upper.substring(2, 4);
    if(UF_LIST.has(maybeUf)) return maybeUf;
  }
  const matchEnd = upper.match(/\b([A-Z]{2})\b$/);
  if (matchEnd && UF_LIST.has(matchEnd[1])) return matchEnd[1];
  
  const anyMatches = upper.match(/\b([A-Z]{2})\b/g);
  if (anyMatches) {
    for (const m of anyMatches) {
      if (UF_LIST.has(m)) return m;
    }
  }
  return 'NI';
};

const MAP_MACRO_AREA = (area: string): string => {
  const a = area.toLowerCase();
  if (a.includes('medicina') || a.includes('biol') || a.includes('saúde') || a.includes('odonto') || a.includes('farma') || a.includes('veter')) return 'Ciências da Vida';
  if (a.includes('eng') || a.includes('física') || a.includes('quím') || a.includes('matemática') || a.includes('comp') || a.includes('inform') || a.includes('geoc')) return 'Engenharias e Exatas';
  return 'Humanas e Sociais Apl.';
};

const MAP_LEVEL_GROUP = (level: string): string => {
  if (level === 'PQ-SR') return 'Senior';
  if (level.startsWith('PQ-1')) return 'Topo (1A-1D)';
  return 'Base (PQ-2, etc)';
};

export const parseData = (file?: File): Promise<Researcher[]> => {
  return new Promise((resolve) => {
    const processResults = (results: any[]) => {
      const parsed = results.slice(1).map((row: any) => {
        const macroAreaStr = row[0] ? String(row[0]).trim() : '';
        const areaStr = row[1] ? String(row[1]).trim() : '';
        const nameStr = row[2] ? String(row[2]).trim() : '';
        const genderStr = row[3] ? String(row[3]).trim() : '';
        const levelStr = row[4] ? String(row[4]).trim() : '';
        const instStr = row[5] ? String(row[5]).trim() : '';
        const ufStr = row[6] ? String(row[6]).trim() : '';
        
        let gender = 'Outro';
        const strValues = Object.values(row).map((v: any) => String(v || '').trim().toUpperCase());
        
        // Helper to check if a string is a gender indicator
        const isWomen = (v: string) => v.startsWith('FEM') || v === 'F' || v === 'MULHER' || v === 'FEMININO';
        const isMen = (v: string) => v.startsWith('MASC') || v === 'M' || v === 'HOMEM' || v === 'MASCULINO';
        
        if (isWomen(genderStr.toUpperCase())) {
          gender = 'Mulher';
        } else if (isMen(genderStr.toUpperCase())) {
          gender = 'Homem';
        } else {
          // If gender column is invalid, fallback to searching all columns
          const womenMatch = strValues.find(isWomen);
          if (womenMatch) {
             gender = 'Mulher';
          } else {
             const menMatch = strValues.find(isMen);
             if (menMatch) {
               gender = 'Homem';
             }
          }
        }

        let finalUf = ufStr.toUpperCase();
        if (!UF_LIST.has(finalUf)) {
            finalUf = EXTRACT_UF(instStr);
            if (!UF_LIST.has(finalUf)) {
               finalUf = EXTRACT_UF(ufStr) // maybe it has state info
            }
        }
        
        return {
          area: areaStr,
          name: nameStr,
          gender,
          level: levelStr,
          institution: instStr,
          uf: finalUf,
          macroArea: macroAreaStr || MAP_MACRO_AREA(areaStr),
          levelGroup: MAP_LEVEL_GROUP(levelStr)
        };
      }).filter((r: any) => r.name);
      resolve(parsed);
    };

    if (!file) {
      Papa.parse(rawData, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => processResults(results.data)
      });
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => processResults(results.data)
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const results = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processResults(results as any[]);
      };
      reader.readAsArrayBuffer(file);
    }
  });
};

export const COLORS = {
  women: '#6b21a8', // Purple-800
  womenLight: '#a855f7', // Purple-500
  men: '#0d9488', // Teal-600
  menLight: '#14b8a6', // Teal-500
};
