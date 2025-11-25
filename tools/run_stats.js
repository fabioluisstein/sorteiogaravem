import { SorteioSimples } from '../src/SorteioSimples.js';

const runs = parseInt(process.argv[2] || '1000', 10);
const prefer = [7,8,3,4,11,12];
let success = 0;
const counts = {};
for (let r=0;r<runs;r++){
  const s = new SorteioSimples();
  const res = s.sorteio();
  const simples = res.resultados.filter(r=>r.tipo==='simples');
  const apt303 = simples.find(x=>x.apartamento===303);
  if (apt303){
    const vaga = apt303.vagas && apt303.vagas[0];
    if (prefer.includes(vaga)) success++;
    counts[vaga] = (counts[vaga]||0)+1;
  } else {
    counts['none']=(counts['none']||0)+1;
  }
}

console.log(`runs: ${runs} — success(${prefer.join(',')}): ${success} (${(success/runs*100).toFixed(2)}%)`);
console.log('counts per vaga for apto303:', counts);
