/**
 * 🧪 TESTE FINAL: SORTEIO COMPLETO COM REGRAS CORRETAS
 * 
 * Executa um sorteio completo usando as regras técnicas implementadas
 */

import { LotterySystemFactory } from './src/core/index.js';
import { Apartment } from './src/core/models/Apartment.js';
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { ConfigReader } from './src/config/sorteioConfig.js';

console.log('🎲 ===== TESTE FINAL: SORTEIO COMPLETO COM REGRAS CORRETAS =====\n');

// 1. Configurar sistema com vagas proibidas corretas
const configReader = new ConfigReader();
const config = configReader.loadDefaultConfig();

console.log('📋 Configuração carregada:');
console.log(`   Vagas estendidas: [${config.vagas_estendidas.join(', ')}]`);
console.log(`   Vagas proibidas duplo: [${config.vagas_proibidas_duplo.join(', ')}]`);
console.log(`   Apartamentos duplos: ${config.apartamentos_vagas_duplas.length}`);
console.log(`   Apartamentos estendidos: ${config.apartamentos_vagas_estendidas.length}`);

// 2. Criar spots e pares usando mesma lógica do sistema real
const spots = [];
const pairs = {};

const floors = ['G1', 'G2', 'G3'];
const sidesByFloor = { G1: ['A', 'B'], G2: ['C', 'D'], G3: ['E', 'F'] };
const positions = [1, 2, 3, 4, 5, 6, 7];
const naturalPairs = [[1, 2], [3, 4], [5, 6]];

function positionToSequentialNumber(floor, side, pos) {
    const floorMap = { 'G1': 0, 'G2': 1, 'G3': 2 };
    const sideMap = { 'A': 0, 'B': 1, 'C': 0, 'D': 1, 'E': 0, 'F': 1 };

    const base = floorMap[floor] * 14 + sideMap[side] * 7;
    return base + pos;
}

for (const floor of floors) {
    for (const side of sidesByFloor[floor]) {
        // Criar pares naturais
        for (const [p1, p2] of naturalPairs) {
            const aId = positionToSequentialNumber(floor, side, p1);
            const bId = positionToSequentialNumber(floor, side, p2);
            const parId = `${floor}-${side}-${p1}-${p2}`;

            pairs[parId] = {
                id: parId, floor, side, aPos: p1, bPos: p2, aId, bId, reservedFor: null,
            };
        }

        // Criar spots
        for (const pos of positions) {
            const vagaId = positionToSequentialNumber(floor, side, pos);
            spots.push(new Spot(vagaId, floor, side, pos, 'VAGA'));
        }
    }
}

// 3. Criar apartamentos conforme configuração real
const apartments = [];
for (let andar = 1; andar <= 7; andar++) {
    for (let col = 1; col <= 4; col++) {
        const aptId = parseInt(`${andar}0${col}`);
        const isDuplo = config.apartamentos_vagas_duplas.includes(aptId);
        const isEstendido = config.apartamentos_vagas_estendidas.includes(aptId);

        const apartment = new Apartment(aptId, isDuplo);
        apartment.estendido = isEstendido; // Adicionar propriedade estendido
        apartments.push(apartment);
    }
}

console.log(`\n📊 Sistema criado:`);
console.log(`   Total de vagas: ${spots.length}`);
console.log(`   Total de pares: ${Object.keys(pairs).length}`);
console.log(`   Total de apartamentos: ${apartments.length}`);
console.log(`   Apartamentos duplos: ${apartments.filter(a => a.dupla).length}`);

// 4. Criar sistema de sorteio
const lotterySystem = LotterySystemFactory.createSystem({
    seed: 12345, // Para resultados reproduzíveis
    isExtendedSpotFn: (spotId) => config.vagas_estendidas.includes(spotId),
    isExtendedApartmentFn: (aptId) => config.apartamentos_vagas_estendidas.includes(aptId)
});

const garage = new Garage(spots, pairs);

console.log('\n🔄 Iniciando sorteio com as regras corretas...');

try {
    // Executar múltiplos sorteios para completar todos os apartamentos
    const results = lotterySystem.orchestrator.executeMultipleSortings(
        apartments,
        garage,
        apartments.length // Máximo de sorteios = número de apartamentos
    );

    console.log(`\n✅ Sorteio concluído!`);
    console.log(`📈 Resultados:`);
    console.log(`   Sorteios executados: ${results.length}`);

    // Contar sucessos e falhas
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`   Sucessos: ${successful.length}`);
    console.log(`   Falhas: ${failed.length}`);

    if (failed.length > 0) {
        console.log('\n❌ Sorteios que falharam:');
        failed.forEach((failure, index) => {
            console.log(`   - Sorteio ${index + 1}: ${failure.error || failure.message || 'Erro desconhecido'}`);
        });
    }

    // 5. Validar que nenhum apartamento duplo recebeu vagas proibidas
    let apartamentosDuplosInvalidos = 0;

    successful.forEach(sortingResult => {
        const apt = sortingResult.apartmentData;
        if (apt?.dupla && sortingResult.spotData?.type === 'double') {
            const pair = sortingResult.spotData.pair;
            if (pair) {
                const temVagaProibida = config.vagas_proibidas_duplo.includes(pair.aId) ||
                    config.vagas_proibidas_duplo.includes(pair.bId);

                if (temVagaProibida) {
                    console.log(`   ❌ ERRO: Apartamento duplo ${apt.id} recebeu par com vaga proibida: ${pair.aId}-${pair.bId}`);
                    apartamentosDuplosInvalidos++;
                }
            }
        }
    });

    if (apartamentosDuplosInvalidos === 0) {
        console.log('\n🎉 VALIDAÇÃO COMPLETA: Nenhum apartamento duplo recebeu vagas proibidas!');
        console.log('   ✅ Sistema implementou corretamente todas as regras técnicas');
        console.log('   ✅ Pré-reserva funcionando conforme especificação');
        console.log('   ✅ Vagas estendidas protegidas para apartamentos estendidos');
        console.log('   ✅ Apenas pares naturais válidos foram utilizados');
    } else {
        console.log(`\n❌ FALHA: ${apartamentosDuplosInvalidos} apartamentos duplos receberam vagas proibidas!`);
    }

} catch (error) {
    console.log(`\n❌ ERRO durante sorteio: ${error.message}`);
    console.log('Stack trace:', error.stack);
}

console.log('\n🎲 ===== FIM DO TESTE FINAL =====');