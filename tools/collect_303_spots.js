import { SorteioSimples } from '../src/SorteioSimples.js';

// Config
const ITERATIONS = 10000;
const DEBUG_RUNS = 5; // small number of runs with debug logging enabled to inspect internal states
// Use the updated VIP choices as requested
const VIP_CHOICES = [10, 5, 14, 11, 12, 6, 9, 4, 3, 13];

const counts = new Map();
let totalAssigned = 0;

for (let i = 0; i < ITERATIONS; i++) {
    const debug = i < DEBUG_RUNS; // enable debug for first few iterations
    const s = new SorteioSimples({ debug });
    const res = s.sorteio();
    if (!res || !res.resultados) continue;

    const entry = res.resultados.find(r => r.apartamento === 303);
    if (entry) {
        totalAssigned++;
        const vagaId = Array.isArray(entry.vagas) ? entry.vagas[0] : entry.vaga;
        counts.set(vagaId, (counts.get(vagaId) || 0) + 1);
    }
}

// Output summary
console.log(`Ran ${ITERATIONS} iterations`);
console.log(`Apartment 303 received a vaga in ${totalAssigned} runs (${((totalAssigned / ITERATIONS) * 100).toFixed(2)}%)`);

const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
console.log('\nVaga counts for apt 303:');
for (const [vaga, cnt] of sorted) {
    const vipFlag = VIP_CHOICES.includes(vaga) ? 'VIP' : 'NON-VIP';
    console.log(`  Vaga ${vaga}: ${cnt} (${vipFlag})`);
}

const anomalies = sorted.filter(([vaga]) => !VIP_CHOICES.includes(vaga)).map(([v]) => v);
if (anomalies.length === 0) {
    console.log('\nNo anomalies: all assigned vagas were within VIP_CHOICES.');
} else {
    console.log('\nAnomalies detected — vagas outside VIP_CHOICES assigned to apt 303:');
    console.log(anomalies.join(', '));
}

console.log('\nVIP_CHOICES:', VIP_CHOICES.join(', '));

process.exit(0);
