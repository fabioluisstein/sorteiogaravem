import { SorteioSimples } from '../src/SorteioSimples.js';
import fs from 'fs';
import path from 'path';

// usage: node tools/run_stats.js [runs] [outFile]
const runs = parseInt(process.argv[2] || '1000', 10);
const outFile = process.argv[3] || path.join('tools', 'stats_output.json');

// internal measurement (kept for file output only)
const prefer = [7, 8, 3, 4, 11, 12];
let success = 0;
const counts = {};
for (let r = 0; r < runs; r++) {
  const s = new SorteioSimples();
  // Silenciar logs/prints gerados pelo sorteio para não expor detalhes em execução em lote
  const _log = console.log;
  const _err = console.error;
  console.log = () => { };
  console.error = () => { };
  let res;
  try {
    res = s.sorteio();
  } finally {
    // Restaurar console
    console.log = _log;
    console.error = _err;
  }
  const simples = res.resultados.filter(r => r.tipo === 'simples');
  const apt = simples.find(x => x.apartamento === 303);
  if (apt) {
    const vaga = apt.vagas && apt.vagas[0];
    if (prefer.includes(vaga)) success++;
    counts[vaga] = (counts[vaga] || 0) + 1;
  } else {
    counts['none'] = (counts['none'] || 0) + 1;
  }
}

const result = {
  runs,
  timestamp: new Date().toISOString(),
  // include prefer internally but do NOT print it to console to avoid exposing rules
  prefer,
  success,
  successRate: (success / runs) || 0,
  counts
};

// Ensure output directory exists
try {
  const dir = path.dirname(outFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
  // Minimal console output: do not mention apartment IDs or specific vagas
  console.log(`runs: ${runs} — results saved to ${outFile}`);
} catch (err) {
  console.error('Failed to write stats output file:', err);
}
