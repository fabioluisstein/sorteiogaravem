import { SorteioSimples } from './src/SorteioSimples.js';

console.log('🔍 Verificando pares oficiais no SorteioSimples:');

const sorteio = new SorteioSimples();
const pares = sorteio.criarPares();

console.log(`\n📊 Total de pares: ${pares.length}`);
console.log('\n📋 Lista de pares oficiais:');

pares.forEach((par, index) => {
    console.log(`   ${index + 1}. ${par.id}: (${par.vagaA}, ${par.vagaB})`);
});

console.log('\n✅ Verificação dos pares por andar:');
console.log('G1:', pares.filter(p => p.id.startsWith('G1')).map(p => `(${p.vagaA},${p.vagaB})`).join(', '));
console.log('G2:', pares.filter(p => p.id.startsWith('G2')).map(p => `(${p.vagaA},${p.vagaB})`).join(', '));
console.log('G3:', pares.filter(p => p.id.startsWith('G3')).map(p => `(${p.vagaA},${p.vagaB})`).join(', '));

console.log('\n🚫 Verificando vagas estendidas:');
const vagas = sorteio.criarVagas();
const vagasEstendidas = vagas.filter(v => v.estendida);
console.log('Vagas estendidas encontradas:', vagasEstendidas.map(v => v.id).join(', '));

console.log('\n✅ Validação de pares vs vagas estendidas:');
let paresComEstendidas = 0;
pares.forEach(par => {
    const vagaAEstendida = vagasEstendidas.some(v => v.id === par.vagaA);
    const vagaBEstendida = vagasEstendidas.some(v => v.id === par.vagaB);

    if (vagaAEstendida || vagaBEstendida) {
        console.log(`❌ Par ${par.id} contém vaga estendida: ${par.vagaA}-${par.vagaB}`);
        paresComEstendidas++;
    }
});

if (paresComEstendidas === 0) {
    console.log('✅ Nenhum par contém vagas estendidas - CORRETO!');
} else {
    console.log(`❌ ${paresComEstendidas} pares contêm vagas estendidas - PROBLEMA!`);
}