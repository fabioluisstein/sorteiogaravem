import { SorteioSimples } from '../src/SorteioSimples.js';

function countByRange(vagas) {
    const counts = { G1: 0, G2: 0, G3: 0 };
    for (const v of vagas) {
        if (v >= 1 && v <= 14) counts.G1++;
        else if (v >= 15 && v <= 28) counts.G2++;
        else if (v >= 29 && v <= 42) counts.G3++;
    }
    return counts;
}

const s = new SorteioSimples();
const res = s.sorteio();
if (!res || !res.sucesso) {
    console.error('Sorteio falhou', res);
    process.exit(1);
}

const duplos = res.resultados.filter(r => r.tipo === 'duplo');
const vagasDuplos = duplos.flatMap(d => d.vagas);
const counts = countByRange(vagasDuplos);

console.log('Duplos selecionados:', duplos.length);
console.log('Vagas por bloco (após alocação de duplos):', counts);
console.log('Vagas ocupadas totais:', s.vagas.filter(v => v.ocupada).map(v => v.id).length);
console.log('Vagas ocupadas (lista):', s.vagas.filter(v => v.ocupada).map(v => v.id).join(', '));
console.log('Resultados duplos (par/apt):');
for (const d of duplos) console.log(` apt ${d.apartamento} -> ${d.vagas.join('-')} (par ${d.par})`);

// exit
process.exit(0);
