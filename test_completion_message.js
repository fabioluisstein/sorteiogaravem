/**
 * Teste da mensagem de conclusão do sorteio
 */

import { LotteryOrchestrator } from './src/core/services/LotteryOrchestrator.js';
import { ApartmentSelectionService } from './src/core/services/ApartmentSelectionService.js';
import { ApartmentTypeDetectorService } from './src/core/services/ApartmentTypeDetectorService.js';
import { SpotSelectionService } from './src/core/services/SpotSelectionService.js';
import { SpotAssignmentService } from './src/core/services/SpotAssignmentService.js';
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { Apartment } from './src/core/models/Apartment.js';

console.log('🧪 TESTE: Mensagem de Finalização do Sorteio');
console.log('===========================================');

// Criar poucos apartamentos para teste rápido
const apartments = [
    new Apartment(601, 6, 1, false, false),  // simples
    new Apartment(602, 6, 2, false, false),  // simples
    new Apartment(101, 1, 1, true, false),   // duplo
];

// Criar spots suficientes
const spots = [];
for (let i = 1; i <= 10; i++) {
    const floor = i <= 5 ? 'G1' : 'G2';
    const side = ['A', 'B'][Math.floor((i-1) % 2)];
    const pos = Math.floor((i-1) / 2) + 1;
    
    const spot = new Spot(i, floor, side, pos);
    spots.push(spot);
}

const garage = new Garage(spots, {});

// Criar orquestrador
const apartmentSelector = new ApartmentSelectionService();
const typeDetector = new ApartmentTypeDetectorService();
const spotSelector = new SpotSelectionService();
const spotAssigner = new SpotAssignmentService();

const orchestrator = new LotteryOrchestrator(
    apartmentSelector, 
    typeDetector, 
    spotSelector, 
    spotAssigner
);

console.log('\n📋 CONFIGURAÇÃO DO TESTE:');
console.log(`   - Apartamentos: ${apartments.length}`);
console.log(`   - Spots: ${spots.length}`);
console.log('   - Lista: 601 (simples), 602 (simples), 101 (duplo)');

console.log('\n🎲 EXECUTANDO SORTEIO COMPLETO...');
console.log('=====================================');

const result = orchestrator.executeMultipleSortings(apartments, garage);

console.log('\n✅ RESULTADO FINAL:');
console.log(`   - Total de sorteios: ${result.totalDraws}`);
console.log(`   - Sucessos: ${result.successfulDraws}`);
console.log(`   - Falhas: ${result.failedDraws}`);
console.log(`   - Todos sorteados: ${result.allApartmentsSorted ? 'SIM' : 'NÃO'}`);

if (result.allApartmentsSorted) {
    console.log('\n🎉 MENSAGEM DE SUCESSO EXIBIDA CORRETAMENTE!');
} else {
    console.log('\n⚠️ Nem todos os apartamentos foram sorteados');
}

console.log('\n===========================================')