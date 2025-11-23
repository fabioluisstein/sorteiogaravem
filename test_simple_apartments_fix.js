/**
 * Teste para verificar se apartamentos simples conseguem vagas após correção
 */

import Garage from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';

console.log('🧪 TESTE: Apartamentos Simples Após Correção');
console.log('============================================');

// Configurar spots
const spots = [];
for (let i = 1; i <= 42; i++) {
    const floor = i <= 14 ? 'G1' : (i <= 28 ? 'G2' : 'G3');
    const side = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor((i - 1) % 6)];
    const pos = Math.floor((i - 1) / 6) + 1;

    const spot = new Spot(i, floor, side, pos);
    spots.push(spot);
}

const garage = new Garage(spots, {});

console.log('\n1. 🔄 PRÉ-RESERVAR PARES PARA DUPLOS');
garage.preReserveDoublePairs(14);
const preReserved = Object.keys(garage.doublePairReservations);
console.log(`   - Pares pré-reservados: ${preReserved.length}`);

console.log('\n2. 🏠 SIMULAR SORTEIO DE UM APARTAMENTO DUPLO');
// Simular que o par OFICIAL-25-26 foi usado (como no log)
if (garage.doublePairReservations['OFICIAL-25-26']) {
    delete garage.doublePairReservations['OFICIAL-25-26'];
    garage.occupySpot(25, 402);
    garage.occupySpot(26, 402);
    console.log('   ✅ Apartamento duplo 402 ocupou par OFICIAL-25-26');
}

console.log('\n3. 🏠 SIMULAR APARTAMENTO ESTENDIDO');
// Simular que vaga 36 foi ocupada por apartamento estendido
garage.occupySpot(36, 703);
console.log('   ✅ Apartamento estendido 703 ocupou vaga 36');

console.log('\n4. 🔍 VERIFICAR VAGAS PARA APARTAMENTO SIMPLES');
const normalSpots = garage.getFreeNormalSpots((spotId) => {
    // Vagas estendidas (proibidas para simples)
    return [7, 8, 21, 22, 35, 36].includes(spotId);
});

console.log(`   - Vagas normais disponíveis: ${normalSpots.length}`);
console.log(`   - Lista de vagas: [${normalSpots.map(s => s.id).sort((a, b) => a - b).join(', ')}]`);

console.log('\n5. 🔍 VERIFICAR PRÉ-RESERVAS RESTANTES');
const remainingReserved = Object.keys(garage.doublePairReservations);
console.log(`   - Pares ainda pré-reservados: ${remainingReserved.length}`);
console.log(`   - Lista: [${remainingReserved.join(', ')}]`);

if (normalSpots.length > 0) {
    console.log('\n✅ SUCESSO: Apartamentos simples têm vagas disponíveis!');
    console.log(`   - Primeira vaga disponível: ${normalSpots[0].id}`);
} else {
    console.log('\n❌ PROBLEMA: Ainda não há vagas para apartamentos simples');
}

console.log('\n============================================');