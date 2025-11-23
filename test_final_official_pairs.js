/**
 * Teste final para verificar se o sistema usa corretamente os pares oficiais
 */

import fs from 'fs';
import path from 'path';

// Carregar os modelos
import Garage from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';

// Configurar dados de teste
const spots = [];
for (let i = 1; i <= 42; i++) {
    // Criar instâncias válidas da classe Spot
    // Usando dados aproximados para floor, side, pos
    const floor = i <= 14 ? 'G1' : (i <= 28 ? 'G2' : 'G3');
    const side = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor((i - 1) % 6)];
    const pos = Math.floor((i - 1) / 6) + 1;

    const spot = new Spot(i, floor, side, pos);
    spots.push(spot);
}

console.log('🧪 TESTE FINAL: Sistema com Pares Oficiais');
console.log('================================================');

// Criar nova garagem
const garage = new Garage(spots, {});

console.log('\n1. ✅ VERIFICAÇÃO DOS PARES OFICIAIS');
const officialPairs = garage.getValidDoubleSpotPairs();
console.log(`   - Total de pares oficiais: ${officialPairs.length}`);
console.log(`   - Lista completa:`);
officialPairs.forEach(pair => {
    console.log(`     Par ${pair.id}: (${pair.aId}, ${pair.bId})`);
});

console.log('\n2. ✅ VERIFICAÇÃO DE PARES LIVRES');
const freePairs = garage.getFreePairs();
console.log(`   - Pares livres encontrados: ${freePairs.length}`);
console.log(`   - Deve ser igual aos pares oficiais: ${freePairs.length === officialPairs.length ? '✔ SIM' : '❌ NÃO'}`);

console.log('\n3. ✅ PRÉ-RESERVA DE PARES DUPLOS');
garage.preReserveDoublePairs(14); // 14 apartamentos duplos
const reservedPairs = Object.keys(garage.doublePairReservations);
console.log(`   - Pares pré-reservados: ${reservedPairs.length}`);
console.log(`   - Meta de 14 pares: ${reservedPairs.length === 14 ? '✔ SIM' : '❌ NÃO'}`);

console.log('\n4. ✅ VALIDAÇÃO DOS PARES RESERVADOS');
let allPairsAreOfficial = true;
let allPairsAvoidProhibited = true;
const prohibitedSpots = [7, 8, 21, 22, 35, 36];

reservedPairs.forEach(pairId => {
    const pair = garage.doublePairReservations[pairId];

    // Verificar se o par está na lista oficial
    const isOfficial = officialPairs.some(op => op.id === pairId);
    if (!isOfficial) {
        console.log(`   ❌ Par ${pairId} NÃO está na lista oficial`);
        allPairsAreOfficial = false;
    }

    // Verificar vagas proibidas
    if (pair.spotIds) {
        const hasProhibited = pair.spotIds.some(spotId => prohibitedSpots.includes(spotId));
        if (hasProhibited) {
            console.log(`   ❌ Par ${pairId} contém vaga proibida: ${pair.spotIds}`);
            allPairsAvoidProhibited = false;
        }
    }
});

console.log(`   - Todos os pares são oficiais: ${allPairsAreOfficial ? '✔ SIM' : '❌ NÃO'}`);
console.log(`   - Nenhum par tem vaga proibida: ${allPairsAvoidProhibited ? '✔ SIM' : '❌ NÃO'}`);

console.log('\n5. ✅ PARES DISPONÍVEIS PARA DUPLOS');
const availablePairs = garage.getAvailablePairsForDoubleApartments(true);
console.log(`   - Pares disponíveis para duplos: ${availablePairs.length}`);
console.log(`   - Deve incluir pré-reservados: ${availablePairs.length >= reservedPairs.length ? '✔ SIM' : '❌ NÃO'}`);

console.log('\n6. ✅ RESUMO FINAL');
const success = (
    officialPairs.length === 18 &&
    freePairs.length === officialPairs.length &&
    reservedPairs.length === 14 &&
    allPairsAreOfficial &&
    allPairsAvoidProhibited &&
    availablePairs.length >= reservedPairs.length
);

console.log(`   Status geral: ${success ? '✔ SUCESSO' : '❌ FALHA'}`);

if (success) {
    console.log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE COM PARES OFICIAIS!');
    console.log('   ✔ 18 pares oficiais definidos');
    console.log('   ✔ Pré-reserva de 14 pares para apartamentos duplos');
    console.log('   ✔ Nenhuma vaga proibida usada');
    console.log('   ✔ Sistema pronto para sorteio');
} else {
    console.log('\n❌ SISTEMA AINDA PRECISA DE AJUSTES');
    console.log('   Verifique os problemas indicados acima');
}

console.log('\n================================================');