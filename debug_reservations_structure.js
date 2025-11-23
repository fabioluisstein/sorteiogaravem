/**
 * Debug: Verificar estrutura das pré-reservas
 */

import Garage from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';

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

console.log('🔍 DEBUG: Estrutura das Pré-reservas');
console.log('===================================');

garage.preReserveDoublePairs(3); // Apenas 3 para debug

console.log('\n📋 ESTRUTURA DO doublePairReservations:');
console.log(JSON.stringify(garage.doublePairReservations, null, 2));

console.log('\n🔍 ANÁLISE DAS RESERVAS:');
for (const [pairId, reservation] of Object.entries(garage.doublePairReservations)) {
    console.log(`\nPar ${pairId}:`);
    console.log(`  - priority: ${reservation.priority}`);
    console.log(`  - spotIds: ${JSON.stringify(reservation.spotIds)}`);
    console.log(`  - apartmentId: ${reservation.apartmentId}`);
    console.log(`  - timestamp: ${reservation.timestamp}`);
}

console.log('\n===================================')