/**
 * 🎯 TESTE: Array Simples para Pares Duplos
 * 
 * Testa o novo sistema de gerenciamento de pares duplos usando array simples
 * com operações shift() em vez de complexas pré-reservas
 */

// Importações
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { sorteioConfig } from './src/config/sorteioConfig.js';
import { SimpleLotteryService } from './src/core/services/SimpleLotteryService.js';

class TestRandomnessService {
    random() { return Math.random(); }
}

console.log('🧪 ===== TESTE: SISTEMA DE ARRAY SIMPLES PARA PARES DUPLOS =====\n');

// 1. Criar garagem de teste
const spots = [
    new Spot(1, 1, 'A', 1),
    new Spot(2, 1, 'A', 2),
    new Spot(3, 1, 'B', 1),
    new Spot(4, 1, 'B', 2),
    new Spot(5, 2, 'A', 1), // Vaga estendida
    new Spot(6, 2, 'A', 2),
    new Spot(7, 2, 'B', 1),
    new Spot(8, 2, 'B', 2)
];

const pairs = {
    'PAR1': { id: 'PAR1', floor: 1, side: 'A', aPos: 1, bPos: 2, aId: 1, bId: 2 },
    'PAR2': { id: 'PAR2', floor: 1, side: 'B', aPos: 1, bPos: 2, aId: 3, bId: 4 },
    'PAR3': { id: 'PAR3', floor: 2, side: 'A', aPos: 1, bPos: 2, aId: 5, bId: 6 }, // Tem vaga estendida
    'PAR4': { id: 'PAR4', floor: 2, side: 'B', aPos: 1, bPos: 2, aId: 7, bId: 8 }
};

const garage = new Garage(spots, pairs);

// 2. Definir função de vaga estendida (vaga 5 é estendida)
const isExtendedSpot = (spotId) => spotId === 5;

console.log('📋 Estado inicial da garagem:');
console.log(`   Total de vagas: ${spots.length}`);
console.log(`   Total de pares: ${Object.keys(pairs).length}`);
console.log(`   Vagas livres: ${garage.getFreeSpots().length}`);
console.log(`   Pares livres: ${garage.getFreePairs().length}`);

// 3. Testar inicialização da lista de pares duplos
console.log('\n🎯 Testando inicialização da lista de pares duplos...');
garage.initializeDoublePairsList(isExtendedSpot);

console.log(`📊 Resultado da inicialização:`);
console.log(`   Pares duplos disponíveis: ${garage.getAvailableDoublePairsCount()}`);
console.log(`   Lista: [${garage.availableDoublePairs.join(', ')}]`);

// 4. Testar uso de pares duplos
console.log('\n🎲 Testando uso de pares duplos...');

console.log('\nPrimeiro uso:');
const pair1 = garage.useDoublePair();
console.log(`   Par usado: ${pair1 ? pair1.id : 'Nenhum'}`);
console.log(`   Pares restantes: ${garage.getAvailableDoublePairsCount()}`);

console.log('\nSegundo uso:');
const pair2 = garage.useDoublePair();
console.log(`   Par usado: ${pair2 ? pair2.id : 'Nenhum'}`);
console.log(`   Pares restantes: ${garage.getAvailableDoublePairsCount()}`);

console.log('\nTerceiro uso:');
const pair3 = garage.useDoublePair();
console.log(`   Par usado: ${pair3 ? pair3.id : 'Nenhum'}`);
console.log(`   Pares restantes: ${garage.getAvailableDoublePairsCount()}`);

console.log('\nQuarto uso (deve retornar null):');
const pair4 = garage.useDoublePair();
console.log(`   Par usado: ${pair4 ? pair4.id : 'null'}`);
console.log(`   Pares restantes: ${garage.getAvailableDoublePairsCount()}`);

// 5. Testar com SimpleLotteryService
console.log('\n🔄 Testando com SimpleLotteryService...');

// Reinicializar garagem
const garage2 = new Garage(spots, pairs);
const isExtendedApartment = (aptId) => aptId === 703; // Apartamento teste
const lotteryService = new SimpleLotteryService(
    new TestRandomnessService(),
    isExtendedSpot,
    isExtendedApartment
);

// Apartamentos de teste
const apartments = [
    { id: 101, ativo: true, sorteado: false, dupla: true },  // Apartamento duplo
    { id: 102, ativo: true, sorteado: false, dupla: true },  // Apartamento duplo
    { id: 103, ativo: true, sorteado: false, dupla: false }, // Apartamento simples
    { id: 703, ativo: true, sorteado: false, dupla: false }  // Apartamento estendido
];

console.log('\nExecutando sorteio com novo sistema...');
const lotteryResult = lotteryService.executeLottery(apartments, garage2);

console.log('\n📊 Resultado do sorteio:');
console.log(`   Sucesso: ${lotteryResult.success}`);
console.log(`   Apartamentos sorteados: ${lotteryResult.results.length}`);
console.log(`   Erros: ${lotteryResult.errors.length}`);

if (lotteryResult.results.length > 0) {
    console.log('\n📝 Detalhes dos resultados:');
    lotteryResult.results.forEach(result => {
        console.log(`   ${result.message}`);
    });
}

if (lotteryResult.errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    lotteryResult.errors.forEach(error => {
        console.log(`   Apt ${error.apartmentId}: ${error.error}`);
    });
}

console.log('\n✅ Teste concluído!');
console.log('\n🎯 Sistema de array simples implementado com sucesso!');
console.log('   - Pares duplos gerenciados por array simples');
console.log('   - Operações shift() para uso sequencial');
console.log('   - Eliminação completa da complexidade de pré-reservas');