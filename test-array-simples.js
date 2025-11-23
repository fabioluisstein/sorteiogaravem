/**
 * 🧪 TESTE DA NOVA ABORDAGEM SIMPLES
 * Teste da implementação de array simples para pares duplos
 */

import Garage from './src/core/models/Garage.js';
import Spot from './src/core/models/Spot.js';
import Apartment from './src/core/models/Apartment.js';
import SimpleLotteryService from './src/core/services/SimpleLotteryService.js';
import { sorteioConfig } from './src/config/sorteioConfig.js';

// Mock do serviço de aleatorização
class MockRandomService {
    constructor(sequence = [0.5]) {
        this.sequence = sequence;
        this.index = 0;
    }

    random() {
        const value = this.sequence[this.index % this.sequence.length];
        this.index++;
        return value;
    }
}

async function testeArraySimples() {
    console.log('🎯 ===== TESTE ARRAY SIMPLES PARA PARES DUPLOS =====\n');

    try {
        // 1. Configurar ambiente de teste
        console.log('📋 1. Configurando ambiente de teste...');
        await sorteioConfig.loadFromString('apartamentos_vagas_duplas=101,102');

        // 2. Criar vagas de teste
        const spots = [
            new Spot(1, 1, 'A', 1, false),  // Vaga normal
            new Spot(2, 1, 'A', 2, false),  // Vaga normal (par com 1)
            new Spot(3, 1, 'A', 3, false),  // Vaga normal
            new Spot(4, 1, 'A', 4, false),  // Vaga normal (par com 3)
            new Spot(5, 1, 'A', 5, false),  // Vaga normal
            new Spot(6, 1, 'A', 6, false),  // Vaga normal (par com 5)
        ];

        // 3. Criar pares de teste
        const pairs = {
            'P1': { id: 'P1', floor: 1, side: 'A', aPos: 1, bPos: 2, aId: 1, bId: 2 },
            'P2': { id: 'P2', floor: 1, side: 'A', aPos: 3, bPos: 4, aId: 3, bId: 4 },
            'P3': { id: 'P3', floor: 1, side: 'A', aPos: 5, bPos: 6, aId: 5, bId: 6 }
        };

        // 4. Criar garagem
        const garage = new Garage(spots, pairs);
        console.log('✅ Garagem criada com 6 vagas e 3 pares\n');

        // 5. Inicializar array de pares duplos
        console.log('🔄 2. Inicializando array de pares duplos...');
        const pairsCount = garage.initializeDoublePairsList();
        console.log(`✅ ${pairsCount} pares duplos inicializados\n`);

        // 6. Verificar estado inicial
        console.log('📊 3. Estado inicial:');
        console.log(`   📋 Pares disponíveis: ${garage.getDoublePairsCount()}`);
        console.log(`   📝 Lista: ${JSON.stringify(garage.listAvailableDoublePairs())}\n`);

        // 7. Usar um par duplo
        console.log('🎲 4. Testando uso de par duplo para apartamento 101...');
        const usedPair1 = garage.useDoublePair('101');

        if (usedPair1) {
            console.log(`✅ Par ${usedPair1.id} usado para apartamento 101`);
            console.log(`   📋 Restam: ${garage.getDoublePairsCount()} pares`);
        } else {
            console.log(`❌ Falha ao usar par para apartamento 101`);
        }

        // 8. Usar outro par duplo
        console.log('\n🎲 5. Testando uso de outro par duplo para apartamento 102...');
        const usedPair2 = garage.useDoublePair('102');

        if (usedPair2) {
            console.log(`✅ Par ${usedPair2.id} usado para apartamento 102`);
            console.log(`   📋 Restam: ${garage.getDoublePairsCount()} pares`);
        } else {
            console.log(`❌ Falha ao usar par para apartamento 102`);
        }

        // 9. Verificar estado das vagas
        console.log('\n📊 6. Estado das vagas após uso:');
        spots.forEach(spot => {
            if (spot.isOccupied) {
                console.log(`   🔴 Vaga ${spot.id}: ocupada por apartamento ${spot.apartmentNumber}`);
            } else {
                console.log(`   🟢 Vaga ${spot.id}: livre`);
            }
        });

        // 10. Tentar usar quando não há mais pares
        console.log('\n🎲 7. Testando esgotamento de pares...');
        garage.useDoublePair('103'); // Deve usar último par
        const failedUse = garage.useDoublePair('104'); // Deve falhar

        if (!failedUse) {
            console.log('✅ Corretamente retornou null quando não há pares disponíveis');
        } else {
            console.log('❌ Deveria ter retornado null');
        }

        console.log('\n🎯 ===== TESTE ARRAY SIMPLES CONCLUÍDO COM SUCESSO =====');

    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        console.error('Stack:', error.stack);
    }
}

// 11. Teste integrado com SimpleLotteryService
async function testeIntegracaoLottery() {
    console.log('\n🎯 ===== TESTE INTEGRAÇÃO COM LOTTERY SERVICE =====\n');

    try {
        // Configurar
        await sorteioConfig.loadFromString('apartamentos_vagas_duplas=201,202');

        // Criar vagas
        const spots = [
            new Spot(11, 1, 'B', 1, false),
            new Spot(12, 1, 'B', 2, false),
            new Spot(13, 1, 'B', 3, false),
            new Spot(14, 1, 'B', 4, false),
        ];

        const pairs = {
            'PB1': { id: 'PB1', floor: 1, side: 'B', aPos: 1, bPos: 2, aId: 11, bId: 12 },
            'PB2': { id: 'PB2', floor: 1, side: 'B', aPos: 3, bPos: 4, aId: 13, bId: 14 }
        };

        const garage = new Garage(spots, pairs);

        // Apartamentos duplos
        const apartments = [
            Apartment.fromJSON({ id: '201', dupla: true, ativo: true, sorteado: false }),
            Apartment.fromJSON({ id: '202', dupla: true, ativo: true, sorteado: false })
        ];

        // Lottery Service
        const mockRandom = new MockRandomService([0.3, 0.7]); // Sequência determinística
        const lotteryService = new SimpleLotteryService(
            mockRandom,
            () => false, // Nenhuma vaga é estendida
            () => false  // Nenhum apartamento é estendido
        );

        // Executar sorteio
        console.log('🎲 Executando sorteio...');
        const result = lotteryService.executeLottery(apartments, garage);

        console.log('\n📊 Resultado do sorteio:');
        console.log(`   ✅ Sucessos: ${result.successful}`);
        console.log(`   ❌ Erros: ${result.failed}`);

        if (result.success) {
            console.log('🎉 SORTEIO CONCLUÍDO COM SUCESSO!');
        } else {
            console.log('💥 SORTEIO COM ERROS:', result.errors);
        }

        console.log('\n📋 Detalhes dos resultados:');
        result.results.forEach(r => console.log(`   ${r.message}`));

        console.log('\n🎯 ===== TESTE INTEGRAÇÃO CONCLUÍDO =====');

    } catch (error) {
        console.error('❌ ERRO NA INTEGRAÇÃO:', error);
        console.error('Stack:', error.stack);
    }
}

// Executar testes
console.log('🧪 Iniciando testes da nova abordagem simples...\n');

testeArraySimples()
    .then(() => testeIntegracaoLottery())
    .then(() => {
        console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 ERRO GERAL:', error);
        process.exit(1);
    });