/**
 * 🎯 TESTE RÁPIDO: Verificar se Sistema LEGACY foi removido
 */

// Importações
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';

console.log('🧪 ===== TESTE: VERIFICAÇÃO DE REMOÇÃO DO SISTEMA LEGACY =====\n');

// 1. Criar garagem de teste
const spots = [
    new Spot(1, 1, 'A', 1),
    new Spot(2, 1, 'A', 2),
    new Spot(3, 1, 'A', 3)
];

const pairs = {
    'PAR1': { id: 'PAR1', floor: 1, side: 'A', aPos: 1, bPos: 2, aId: 1, bId: 2 }
};

const garage = new Garage(spots, pairs);
const isExtendedSpot = (spotId) => false;

// 2. Inicializar NOVO sistema (array simples)
console.log('🎯 Inicializando NOVO sistema (array simples)...');
garage.initializeDoublePairsList(isExtendedSpot);
console.log(`   Pares no array: [${garage.availableDoublePairs.join(', ')}]`);

// 3. Verificar que sistema LEGACY NÃO está ativo
console.log('\n🔍 Verificando sistema LEGACY...');
console.log(`   doublePairReservations: ${JSON.stringify(garage.doublePairReservations)}`);
console.log(`   Tem reservas LEGACY: ${Object.keys(garage.doublePairReservations).length > 0}`);

// 4. Verificar bloqueios de vagas simples
console.log('\n📊 Verificando bloqueios de vagas simples...');
const vagasSimples = garage.getFreeNormalSpots(isExtendedSpot);
console.log(`   Vagas simples disponíveis: ${vagasSimples.length}`);
console.log(`   IDs: [${vagasSimples.map(s => s.id).join(', ')}]`);

// 5. Verificação final
console.log('\n✅ VERIFICAÇÃO:');
console.log('   Se aparecer "LEGACY" nos logs acima = ❌ Sistema antigo ainda ativo');
console.log('   Se aparecer apenas "par disponível" = ✅ Sistema novo funcionando');
console.log('   Apenas vaga 3 deve estar disponível para simples (vagas 1,2 bloqueadas por PAR1)');

if (vagasSimples.length === 1 && vagasSimples[0].id === 3) {
    console.log('\n🎉 SUCESSO: Sistema novo funcionando corretamente!');
} else {
    console.log('\n❌ PROBLEMA: Sistema não está funcionando como esperado');
}