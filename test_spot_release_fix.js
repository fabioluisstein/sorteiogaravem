/**
 * 🎯 TESTE: Verificação de Liberação de Vagas Simples
 * 
 * Testa se vagas simples são corretamente liberadas após uso de pares duplos
 */

// Importações
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { SimpleLotteryService } from './src/core/services/SimpleLotteryService.js';

class TestRandomnessService {
    random() { return Math.random(); }
}

console.log('🧪 ===== TESTE: LIBERAÇÃO DE VAGAS SIMPLES APÓS USO DE PARES DUPLOS =====\n');

// 1. Criar garagem de teste com pares bem definidos
const spots = [
    new Spot(1, 1, 'A', 1),
    new Spot(2, 1, 'A', 2),
    new Spot(3, 1, 'A', 3), // Vaga individual
    new Spot(4, 1, 'B', 1),
    new Spot(5, 1, 'B', 2),
    new Spot(6, 1, 'B', 3)  // Vaga individual
];

const pairs = {
    'PAR1': { id: 'PAR1', floor: 1, side: 'A', aPos: 1, bPos: 2, aId: 1, bId: 2 },
    'PAR2': { id: 'PAR2', floor: 1, side: 'B', aPos: 1, bPos: 2, aId: 4, bId: 5 }
};

const garage = new Garage(spots, pairs);

// 2. Definir função de vaga estendida (nenhuma é estendida neste teste)
const isExtendedSpot = (spotId) => false;

console.log('📋 Estado inicial da garagem:');
console.log(`   Total de vagas: ${spots.length}`);
console.log(`   Total de pares: ${Object.keys(pairs).length}`);
console.log(`   Vagas livres: ${garage.getFreeSpots().map(s => s.id).join(', ')}`);
console.log(`   Pares livres: ${garage.getFreePairs().map(p => p.id).join(', ')}`);

// 3. Inicializar sistema de array simples
garage.initializeDoublePairsList(isExtendedSpot);

console.log('\n🎯 Após inicialização do sistema de pares duplos:');
console.log(`   Pares duplos disponíveis: ${garage.getAvailableDoublePairsCount()}`);
console.log(`   Lista: [${garage.availableDoublePairs.join(', ')}]`);

// 4. Verificar vagas simples ANTES do uso de pares
const vagasSimplesBefore = garage.getFreeNormalSpots(isExtendedSpot);
console.log(`\n📊 Vagas simples disponíveis ANTES: ${vagasSimplesBefore.length}`);
console.log(`   IDs: [${vagasSimplesBefore.map(s => s.id).join(', ')}]`);

// 5. Usar um par duplo
console.log('\n🎲 Usando primeiro par duplo...');
const pairUsado = garage.useDoublePair();
console.log(`   Par usado: ${pairUsado ? pairUsado.id : 'Nenhum'}`);
console.log(`   Vagas do par: ${pairUsado ? `${pairUsado.aId}, ${pairUsado.bId}` : 'N/A'}`);
console.log(`   Pares restantes: ${garage.getAvailableDoublePairsCount()}`);

// 6. Simular ocupação das vagas do par (como faria o sistema de sorteio)
if (pairUsado) {
    console.log(`\n🏗️  Ocupando vagas do par ${pairUsado.id}...`);
    garage.occupySpot(pairUsado.aId, 999); // Apartamento fictício 999
    garage.occupySpot(pairUsado.bId, 999);
    console.log(`   Vaga ${pairUsado.aId} ocupada por apartamento 999`);
    console.log(`   Vaga ${pairUsado.bId} ocupada por apartamento 999`);
}

// 7. Verificar vagas simples DEPOIS do uso do par
console.log('\n📊 Verificando vagas simples APÓS uso do par...');
const vagasTodasLivres = garage.getFreeSpots();
console.log(`   Total de vagas livres: ${vagasTodasLivres.length}`);
console.log(`   IDs livres: [${vagasTodasLivres.map(s => s.id).join(', ')}]`);

const vagasSimplesAfter = garage.getFreeNormalSpots(isExtendedSpot);
console.log(`\n📊 Vagas simples disponíveis DEPOIS: ${vagasSimplesAfter.length}`);
console.log(`   IDs: [${vagasSimplesAfter.map(s => s.id).join(', ')}]`);

// 8. Análise detalhada
console.log('\n🔍 ANÁLISE DETALHADA:');

console.log('\n   Situação esperada:');
console.log('   - PAR1 (vagas 1,2) foi usado → deve estar fora do availableDoublePairs');
console.log('   - PAR1 vagas foram ocupadas → não estão mais livres');
console.log('   - PAR2 (vagas 4,5) ainda disponível → suas vagas devem estar bloqueadas');
console.log('   - Vagas 3,6 (individuais) devem estar disponíveis para simples');

console.log('\n   Verificações:');
garage.getFreeSpots().forEach(spot => {
    const fazParteDePar = garage.availableDoublePairs.some(pairId => {
        const pair = garage.pairs[pairId];
        return pair && (pair.aId === spot.id || pair.bId === spot.id);
    });

    const disponibilidadeParaSimples = !fazParteDePar;

    console.log(`   - Vaga ${spot.id}: ${fazParteDePar ? '🚫 Bloqueada (par ativo)' : '✅ Disponível para simples'}`);
});

// 9. Usar segundo par e verificar novamente
console.log('\n🎲 Usando segundo par duplo...');
const segundoPar = garage.useDoublePair();
if (segundoPar) {
    console.log(`   Segundo par usado: ${segundoPar.id}`);
    console.log(`   Pares restantes: ${garage.getAvailableDoublePairsCount()}`);

    // Simular ocupação
    garage.occupySpot(segundoPar.aId, 888);
    garage.occupySpot(segundoPar.bId, 888);

    console.log('\n📊 Vagas simples após usar TODOS os pares:');
    const vagasFinais = garage.getFreeNormalSpots(isExtendedSpot);
    console.log(`   Disponíveis: ${vagasFinais.length}`);
    console.log(`   IDs: [${vagasFinais.map(s => s.id).join(', ')}]`);

    console.log('\n   🎯 RESULTADO ESPERADO: Apenas vagas 3,6 devem estar disponíveis');
    console.log('   (pois todas as vagas de pares foram usadas/ocupadas)');
} else {
    console.log('   ❌ Nenhum segundo par disponível');
}

console.log('\n✅ Teste de liberação concluído!');
console.log('\n🎯 CORREÇÃO IMPLEMENTADA:');
console.log('   - getFreeNormalSpots() agora usa availableDoublePairs em vez de doublePairReservations');
console.log('   - Vagas são automaticamente liberadas quando pares saem do array');
console.log('   - Sistema usa shift() para remoção automática da lista');