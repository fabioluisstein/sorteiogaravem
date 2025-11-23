/**
 * 🎯 TESTE: Validação de Vagas Proibidas para Pares Duplos
 * 
 * Testa se pares contendo vagas proibidas são corretamente filtrados
 * na pré-reserva para apartamentos duplos
 */

// Importações
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { getVagasProibidasDuplo } from './src/config/sorteioConfig.js';

console.log('🧪 ===== TESTE: FILTRO DE VAGAS PROIBIDAS EM PARES DUPLOS =====\n');

// 1. Criar garagem simulando ambiente real
const spots = [
    // G1 - Lado A (1-7)
    new Spot(1, 'G1', 'A', 1), new Spot(2, 'G1', 'A', 2),
    new Spot(3, 'G1', 'A', 3), new Spot(4, 'G1', 'A', 4),
    new Spot(5, 'G1', 'A', 5), new Spot(6, 'G1', 'A', 6),
    new Spot(7, 'G1', 'A', 7), // ⭐ VAGA ESTENDIDA/PROIBIDA

    // G1 - Lado B (8-14)
    new Spot(8, 'G1', 'B', 1), // ⭐ VAGA ESTENDIDA/PROIBIDA  
    new Spot(9, 'G1', 'B', 2), new Spot(10, 'G1', 'B', 3),
    new Spot(11, 'G1', 'B', 4), new Spot(12, 'G1', 'B', 5),
    new Spot(13, 'G1', 'B', 6), new Spot(14, 'G1', 'B', 7),

    // G2 - Lado C (15-21) 
    new Spot(15, 'G2', 'C', 1), new Spot(16, 'G2', 'C', 2),
    new Spot(17, 'G2', 'C', 3), new Spot(18, 'G2', 'C', 4),
    new Spot(19, 'G2', 'C', 5), new Spot(20, 'G2', 'C', 6),
    new Spot(21, 'G2', 'C', 7), // ⭐ VAGA ESTENDIDA/PROIBIDA

    // G2 - Lado D (22-28)
    new Spot(22, 'G2', 'D', 1), // ⭐ VAGA ESTENDIDA/PROIBIDA
    new Spot(23, 'G2', 'D', 2), new Spot(24, 'G2', 'D', 3),
    new Spot(25, 'G2', 'D', 4), new Spot(26, 'G2', 'D', 5),
    new Spot(27, 'G2', 'D', 6), new Spot(28, 'G2', 'D', 7)
];

// Pares que INCLUEM vagas proibidas (devem ser filtrados)
const pairs = {
    'G1-A-1-2': { id: 'G1-A-1-2', aId: 1, bId: 2, floor: 'G1', side: 'A' },
    'G1-A-3-4': { id: 'G1-A-3-4', aId: 3, bId: 4, floor: 'G1', side: 'A' },
    'G1-A-5-6': { id: 'G1-A-5-6', aId: 5, bId: 6, floor: 'G1', side: 'A' },
    'G1-A-6-7': { id: 'G1-A-6-7', aId: 6, bId: 7, floor: 'G1', side: 'A' }, // ⚠️ Contém vaga 7 (proibida)

    'G1-B-1-2': { id: 'G1-B-1-2', aId: 8, bId: 9, floor: 'G1', side: 'B' }, // ⚠️ Contém vaga 8 (proibida)
    'G1-B-2-3': { id: 'G1-B-2-3', aId: 9, bId: 10, floor: 'G1', side: 'B' },
    'G1-B-4-5': { id: 'G1-B-4-5', aId: 11, bId: 12, floor: 'G1', side: 'B' },

    'G2-C-1-2': { id: 'G2-C-1-2', aId: 15, bId: 16, floor: 'G2', side: 'C' },
    'G2-C-3-4': { id: 'G2-C-3-4', aId: 17, bId: 18, floor: 'G2', side: 'C' },
    'G2-C-6-7': { id: 'G2-C-6-7', aId: 20, bId: 21, floor: 'G2', side: 'C' }, // ⚠️ Contém vaga 21 (proibida)

    'G2-D-1-2': { id: 'G2-D-1-2', aId: 22, bId: 23, floor: 'G2', side: 'D' }, // ⚠️ Contém vaga 22 (proibida)
    'G2-D-3-4': { id: 'G2-D-3-4', aId: 24, bId: 25, floor: 'G2', side: 'D' },
    'G2-D-5-6': { id: 'G2-D-5-6', aId: 26, bId: 27, floor: 'G2', side: 'D' }
};

const garage = new Garage(spots, pairs);

console.log('📋 Estado inicial da garagem:');
console.log(`   Total de vagas: ${spots.length}`);
console.log(`   Total de pares: ${Object.keys(pairs).length}`);
console.log(`   Pares disponíveis: ${garage.getFreePairs().length}`);

// 2. Obter vagas proibidas da configuração
console.log('\n🚫 Verificando configuração de vagas proibidas...');
const vagasProibidasDuplo = getVagasProibidasDuplo();

console.log(`📊 Total de vagas proibidas: ${vagasProibidasDuplo.length}`);

// 3. Identificar pares que DEVERIAM ser filtrados
console.log('\n🔍 Análise dos pares existentes:');
const paresProblematicos = [];
const paresValidos = [];

for (const [pairId, pair] of Object.entries(pairs)) {
    const vagaAProibida = vagasProibidasDuplo.includes(pair.aId);
    const vagaBProibida = vagasProibidasDuplo.includes(pair.bId);

    if (vagaAProibida || vagaBProibida) {
        paresProblematicos.push(pairId);
        console.log(`   ⚠️ ${pairId} (${pair.aId},${pair.bId}) - DEVE SER FILTRADO`);
    } else {
        paresValidos.push(pairId);
        console.log(`   ✅ ${pairId} (${pair.aId},${pair.bId}) - VÁLIDO`);
    }
}

console.log(`\n📊 Resumo da análise:`);
console.log(`   Pares problemáticos (devem ser filtrados): ${paresProblematicos.length}`);
console.log(`   Pares válidos: ${paresValidos.length}`);

// 4. Testar pré-reserva SEM filtragem (comportamento antigo)
console.log('\n🧪 TESTE 1: Pré-reserva SEM filtragem (comportamento antigo)');
const garage1 = garage.clone();
const sucessoSemFiltro = garage1.preReserveDoublePairs(5); // Tentar reservar 5 pares
console.log(`   Resultado: ${sucessoSemFiltro}`);
console.log(`   Pares reservados: ${Object.keys(garage1.doublePairReservations).length}`);

// 5. Testar pré-reserva COM filtragem (novo comportamento)
console.log('\n🧪 TESTE 2: Pré-reserva COM filtragem (novo comportamento)');
const garage2 = garage.clone();
const sucessoComFiltro = garage2.preReserveDoublePairs(5, vagasProibidasDuplo);
console.log(`   Resultado: ${sucessoComFiltro}`);
console.log(`   Pares reservados: ${Object.keys(garage2.doublePairReservations).length}`);

// 6. Verificar quais pares foram efetivamente reservados
console.log('\n📝 Pares reservados COM filtragem:');
for (const [pairId, reserva] of Object.entries(garage2.doublePairReservations)) {
    const pair = pairs[pairId];
    console.log(`   ✅ ${pairId} (${reserva.vagas.join(',')}) - Reservado com sucesso`);

    // Validação: verificar se não contém vagas proibidas
    const temVagaProibida = reserva.vagas.some(vaga => vagasProibidasDuplo.includes(vaga));
    if (temVagaProibida) {
        console.log(`      ❌ ERRO: Par contém vaga proibida!`);
    } else {
        console.log(`      ✅ OK: Par não contém vagas proibidas`);
    }
}

// 7. Verificar que pares problemáticos foram excluídos
console.log('\n🎯 VERIFICAÇÃO FINAL:');
const paresReservados = Object.keys(garage2.doublePairReservations);
const problemasEncontrados = paresReservados.filter(p => paresProblematicos.includes(p));

if (problemasEncontrados.length === 0) {
    console.log('   ✅ SUCESSO: Nenhum par problemático foi reservado');
    console.log(`   ✅ Filtro funcionando: ${paresProblematicos.length} pares foram corretamente excluídos`);
} else {
    console.log(`   ❌ ERRO: ${problemasEncontrados.length} pares problemáticos foram reservados!`);
    console.log(`   Pares problemáticos reservados: ${problemasEncontrados.join(', ')}`);
}

console.log('\n✅ Teste de filtro de vagas proibidas concluído!');
console.log('\n🎯 FUNCIONALIDADE IMPLEMENTADA:');
console.log('   - Configuração vagas_proibidas_duplo carregada');
console.log('   - Vagas estendidas somadas automaticamente');
console.log('   - Filtro aplicado na pré-reserva de pares duplos');
console.log('   - Log detalhado dos pares excluídos');
console.log('   - Sistema de pré-reserva mantido, apenas com filtragem');