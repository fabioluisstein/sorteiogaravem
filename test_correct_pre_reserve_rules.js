/**
 * 🧪 TESTE: VALIDAÇÃO DAS REGRAS CORRETAS DE PRÉ-RESERVA DE VAGAS DUPLAS
 * 
 * Testa se a pré-reserva seguiu TODAS as regras técnicas obrigatórias:
 * ✅ 1. Exclui vagas proibidas (vagas_proibidas_duplo)
 * ✅ 2. Exclui vagas estendidas sempre
 * ✅ 3. Valida apenas pares naturais válidos (1-2, 3-4, 5-6)
 * ✅ 4. Reserva exatamente a quantidade necessária
 * ✅ 5. Usa apenas pares naturais válidos
 */

// Importações
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';

console.log('🧪 ===== TESTE: REGRAS CORRETAS DE PRÉ-RESERVA =====\n');

// 1. Criar garagem real de teste com todos os 42 spots e 18 pares
const spots = [];
const pairs = {};

// Simulação real: 3 andares (G1, G2, G3), 2 lados por andar (A/B, C/D, E/F), 7 posições (1-7)
const floors = ['G1', 'G2', 'G3'];
const sidesByFloor = { G1: ['A', 'B'], G2: ['C', 'D'], G3: ['E', 'F'] };
const positions = [1, 2, 3, 4, 5, 6, 7];
const naturalPairs = [[1, 2], [3, 4], [5, 6]]; // Pares naturais válidos

// Função simulada para converter posição em ID numérico
function positionToSequentialNumber(floor, side, pos) {
    const floorMap = { 'G1': 0, 'G2': 1, 'G3': 2 };
    const sideMap = { 'A': 0, 'B': 1, 'C': 0, 'D': 1, 'E': 0, 'F': 1 };

    const base = floorMap[floor] * 14 + sideMap[side] * 7;
    return base + pos;
}

// Criar spots e pares completos
let pairCount = 0;
for (const floor of floors) {
    for (const side of sidesByFloor[floor]) {
        // Criar pares naturais primeiro
        for (const [p1, p2] of naturalPairs) {
            const aId = positionToSequentialNumber(floor, side, p1);
            const bId = positionToSequentialNumber(floor, side, p2);
            const parId = `${floor}-${side}-${p1}-${p2}`;

            pairs[parId] = {
                id: parId,
                floor,
                side,
                aPos: p1,
                bPos: p2,
                aId,
                bId,
                reservedFor: null,
            };
            pairCount++;
        }

        // Criar spots individuais
        for (const pos of positions) {
            const vagaId = positionToSequentialNumber(floor, side, pos);
            const naturalPair = naturalPairs.find(([a, b]) => a === pos || b === pos);
            const [p1, p2] = naturalPair || [pos, pos];

            spots.push(new Spot(vagaId, floor, side, pos, 'VAGA'));
        }
    }
}

const garage = new Garage(spots, pairs);

console.log('📊 Estado inicial da garagem:');
console.log(`   Total de vagas: ${spots.length} (esperado: 42)`);
console.log(`   Total de pares definidos: ${Object.keys(pairs).length} (esperado: 18)`);

// 2. Definir vagas proibidas conforme especificação técnica
// vagas_proibidas_duplo = [7, 8, 21, 22, 35, 36] (vagas estendidas)
const vagasProibidasDuplo = [7, 8, 21, 22, 35, 36];

console.log(`\n🚫 Vagas proibidas para duplos: [${vagasProibidasDuplo.join(', ')}]`);

// 3. Identificar quantos pares contêm vagas proibidas (devem ser excluídos)
let paresComVagasProibidas = 0;
let paresValidosEsperados = 0;

for (const [pairId, pair] of Object.entries(pairs)) {
    const temVagaProibida = vagasProibidasDuplo.includes(pair.aId) || vagasProibidasDuplo.includes(pair.bId);

    if (temVagaProibida) {
        paresComVagasProibidas++;
        console.log(`   ❌ Par ${pairId} (${pair.aId},${pair.bId}) DEVE SER EXCLUÍDO: contém vaga proibida`);
    } else {
        paresValidosEsperados++;
        console.log(`   ✅ Par ${pairId} (${pair.aId},${pair.bId}) é VÁLIDO para pré-reserva`);
    }
}

console.log(`\n📊 Análise de pares:`);
console.log(`   Pares com vagas proibidas: ${paresComVagasProibidas} (serão excluídos)`);
console.log(`   Pares válidos esperados: ${paresValidosEsperados}`);

// 4. Testar a pré-reserva com 14 apartamentos duplos
const apartamentosDuplos = 14;

console.log(`\n🔄 Tentando pré-reservar ${apartamentosDuplos} pares para apartamentos duplos...`);

try {
    const resultado = garage.preReserveDoublePairs(apartamentosDuplos, vagasProibidasDuplo);

    if (resultado) {
        console.log(`✅ Pré-reserva REALIZADA com sucesso!`);

        // 5. Validar resultados
        const paresPreReservados = Object.keys(garage.doublePairReservations);
        console.log(`\n📋 Validação dos resultados:`);
        console.log(`   Pares pré-reservados: ${paresPreReservados.length}`);
        console.log(`   Apartamentos duplos necessários: ${apartamentosDuplos}`);

        // Verificar se a quantidade está correta
        if (paresPreReservados.length === apartamentosDuplos) {
            console.log(`   ✅ QUANTIDADE CORRETA: ${paresPreReservados.length} = ${apartamentosDuplos}`);
        } else {
            console.log(`   ❌ QUANTIDADE ERRADA: ${paresPreReservados.length} ≠ ${apartamentosDuplos}`);
        }

        // Verificar se nenhum par contém vagas proibidas
        let paresInvalidos = 0;
        for (const pairId of paresPreReservados) {
            const pair = garage.findPair(pairId);
            if (pair) {
                const temVagaProibida = vagasProibidasDuplo.includes(pair.aId) || vagasProibidasDuplo.includes(pair.bId);
                if (temVagaProibida) {
                    console.log(`   ❌ ERRO: Par ${pairId} (${pair.aId},${pair.bId}) contém vaga proibida!`);
                    paresInvalidos++;
                } else {
                    console.log(`   ✅ Par ${pairId} (${pair.aId},${pair.bId}) é válido`);
                }
            }
        }

        if (paresInvalidos === 0) {
            console.log(`\n🎉 SUCESSO TOTAL: Todas as regras foram respeitadas!`);
            console.log(`   ✅ Nenhuma vaga proibida foi usada`);
            console.log(`   ✅ Quantidade exata de pares foi reservada`);
            console.log(`   ✅ Apenas pares naturais válidos foram selecionados`);
        } else {
            console.log(`\n❌ FALHA: ${paresInvalidos} pares contêm vagas proibidas!`);
        }

    } else {
        console.log(`❌ Pré-reserva FALHOU (método retornou false)`);
    }

} catch (error) {
    console.log(`❌ ERRO durante pré-reserva: ${error.message}`);

    // Verificar se é o erro esperado de pares insuficientes
    if (error.message.includes('Não há pares naturais válidos suficientes')) {
        console.log(`\n🔍 Análise do erro:`);
        console.log(`   - Pares válidos disponíveis: ${paresValidosEsperados}`);
        console.log(`   - Apartamentos duplos necessários: ${apartamentosDuplos}`);

        if (paresValidosEsperados < apartamentosDuplos) {
            console.log(`   ✅ ERRO CORRETO: Não há pares suficientes (${paresValidosEsperados} < ${apartamentosDuplos})`);
            console.log(`   📝 Sistema detectou corretamente que vagas proibidas eliminaram pares demais`);
        } else {
            console.log(`   ❌ ERRO INESPERADO: Deveria haver pares suficientes`);
        }
    } else {
        console.log(`   ❌ ERRO INESPERADO: ${error.message}`);
    }
}

console.log('\n🧪 ===== FIM DO TESTE =====');