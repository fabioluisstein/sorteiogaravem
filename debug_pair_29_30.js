/**
 * 🔍 TESTE ESPECÍFICO: Detectar problema com par OFICIAL-29-30
 */

import Garage from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';

console.log('🔍 DIAGNÓSTICO: Problema com Par OFICIAL-29-30');
console.log('==============================================');

// Configurar spots como no sistema real
const spots = [];
for (let i = 1; i <= 42; i++) {
    const floor = i <= 14 ? 'G1' : (i <= 28 ? 'G2' : 'G3');
    const side = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor((i - 1) % 6)];
    const pos = Math.floor((i - 1) / 6) + 1;

    const spot = new Spot(i, floor, side, pos);
    spots.push(spot);
}

const garage = new Garage(spots, {});

console.log('\n1. 🔍 VERIFICAR SPOTS 29 E 30');
const spot29 = garage.findSpot(29);
const spot30 = garage.findSpot(30);

console.log(`   Spot 29: ${spot29 ? `EXISTS (id=${spot29.id}, floor=${spot29.floor}, side=${spot29.side}, pos=${spot29.pos}, free=${spot29.isFree()})` : 'NOT FOUND'}`);
console.log(`   Spot 30: ${spot30 ? `EXISTS (id=${spot30.id}, floor=${spot30.floor}, side=${spot30.side}, pos=${spot30.pos}, free=${spot30.isFree()})` : 'NOT FOUND'}`);

console.log('\n2. 🔍 LISTAR TODOS OS SPOTS CRIADOS');
console.log(`   Total spots criados: ${spots.length}`);
spots.forEach(spot => {
    console.log(`   Spot ${spot.id}: floor=${spot.floor}, side=${spot.side}, pos=${spot.pos}, free=${spot.isFree()}`);
});

console.log('\n3. 🔍 TESTAR getValidDoubleSpotPairs()');
try {
    const validPairs = garage.getValidDoubleSpotPairs();
    console.log(`   Pares válidos encontrados: ${validPairs.length}`);

    const pair29_30 = validPairs.find(pair => pair.id === 'OFICIAL-29-30');
    console.log(`   Par OFICIAL-29-30: ${pair29_30 ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

    if (!pair29_30) {
        console.log('   ❌ PROBLEMA DETECTADO: Par OFICIAL-29-30 não foi criado');

        // Verificar por que não foi criado
        if (!spot29) {
            console.log('   ❌ CAUSA: Spot 29 não existe');
        }
        if (!spot30) {
            console.log('   ❌ CAUSA: Spot 30 não existe');
        }
        if (spot29 && spot30) {
            console.log('   ❌ CAUSA: Spots existem mas não estão livres ou outro problema');
            console.log(`      - Spot 29 livre: ${spot29.isFree()}`);
            console.log(`      - Spot 30 livre: ${spot30.isFree()}`);
        }
    } else {
        console.log(`   ✅ Par encontrado: ${JSON.stringify(pair29_30, null, 2)}`);
    }

} catch (error) {
    console.log(`   ❌ ERRO: ${error.message}`);
}

console.log('\n4. 🔍 VERIFICAR ESTRUTURA DE TODOS OS PARES OFICIAIS');
const paresOficiais = [
    [1, 2], [3, 4], [5, 6], [9, 10], [11, 12], [13, 14],
    [15, 16], [17, 18], [19, 20], [23, 24], [25, 26], [27, 28],
    [29, 30], [31, 32], [33, 34], [37, 38], [39, 40], [41, 42]
];

paresOficiais.forEach(([aId, bId]) => {
    const spotA = garage.findSpot(aId);
    const spotB = garage.findSpot(bId);
    const exists = spotA && spotB;
    const free = exists && spotA.isFree() && spotB.isFree();

    console.log(`   Par (${aId},${bId}): spots_exist=${exists}, both_free=${free}`);

    if (!exists) {
        if (!spotA) console.log(`      ❌ Spot ${aId} não encontrado`);
        if (!spotB) console.log(`      ❌ Spot ${bId} não encontrado`);
    }
});

console.log('\n5. 🔍 TESTAR findPair() PARA OFICIAL-29-30');
const pairByFindPair = garage.findPair('OFICIAL-29-30');
console.log(`   findPair('OFICIAL-29-30'): ${pairByFindPair ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

if (pairByFindPair) {
    console.log(`   ✅ Par encontrado via findPair: id=${pairByFindPair.id}, aId=${pairByFindPair.aId}, bId=${pairByFindPair.bId}`);
} else {
    console.log(`   ❌ PROBLEMA: findPair() não encontra o par OFICIAL-29-30`);
}

console.log('\n6. 🔍 SIMULAR VALIDAÇÃO DO VALIDATIONSERVICE');
// Simular o que o ValidationService faz
const testPair = { id: 'OFICIAL-29-30', aId: 29, bId: 30 };
const foundPair = garage.findPair(testPair.id);

if (foundPair) {
    console.log('   ✅ ValidationService conseguiria encontrar o par');
} else {
    console.log('   ❌ ValidationService falharia - Par não encontrado na garagem');
}

console.log('\n==============================================')