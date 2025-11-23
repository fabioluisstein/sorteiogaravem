/**
 * 🧪 TESTE TASK 5 - FINAL - Verificação completa da marcação de vagas
 * 
 * Teste final verificando que o sistema marca vagas como ocupadas corretamente
 * e que não permite reutilização de vagas já ocupadas
 */

import { SingleSpotAssignmentStrategy } from '../src/services/SingleSpotAssignmentStrategy.js';
import { RandomnessService } from '../src/services/RandomnessService.js';
import { sorteioConfig } from '../src/config/sorteioConfig.js';
import { readFile } from 'fs/promises';

console.log('🧪 TESTE TASK 5 - FINAL - Verificação Completa de Marcação');
console.log('============================================================\n');

// Carrega configuração
const configText = await readFile('./config/sorteio.properties', 'utf-8');
await sorteioConfig.loadFromFile(configText);
console.log('✅ Configuração carregada\n');

const randomService = new RandomnessService(12345);
const strategy = new SingleSpotAssignmentStrategy(randomService);

// Função para criar vaga
const createSpot = (floor, side, pos, parId = null, reservedFor = null) => ({
    id: `${floor}-${side}${pos}`,
    floor: floor,
    side: side,
    pos: pos,
    parId: parId,
    occupiedBy: null,
    reservedForExtended: reservedFor
});

console.log('🔍 VALIDAÇÃO FINAL: Comportamento completo das vagas estendidas');
console.log('===============================================================');

// Cenário: Garagem com vagas estendidas pré-reservadas (simula ExtendedReservationService)
const garagemCompleta = {
    spots: [
        createSpot('G1', 'A', 1),                // vaga normal 1
        createSpot('G1', 'A', 2),                // vaga normal 2
        createSpot('G1', 'A', 3),                // vaga normal 3
        createSpot('G1', 'A', 7, null, 303),     // vaga estendida 7 - PRÉ-RESERVADA para 303
        createSpot('G1', 'B', 1, null, 403),     // vaga estendida 8 - PRÉ-RESERVADA para 403
        createSpot('G2', 'C', 7, null, 503),     // vaga estendida 21 - PRÉ-RESERVADA para 503
    ],
    pairs: {},
    extendedReservations: {  // RESERVAS JÁ CRIADAS pelo ExtendedReservationService
        303: "G1-A7",
        403: "G1-B1",
        503: "G2-C7"
    }
};

const apartamentos = [
    { id: 303, dupla: false },  // TEM reserva
    { id: 403, dupla: false },  // TEM reserva
    { id: 503, dupla: false },  // TEM reserva
    { id: 701, dupla: false },  // SEM reserva
    { id: 702, dupla: false }   // SEM reserva
];

console.log('Estado inicial das vagas:');
garagemCompleta.spots.forEach((spot, index) => {
    const vagaNum = index + 1;
    const reserved = spot.reservedForExtended ? `(reservada para ${spot.reservedForExtended})` : '(normal)';
    console.log(`  Vaga ${vagaNum} (${spot.id}): occupiedBy=${spot.occupiedBy} ${reserved}`);
});

let garagemAtual = { ...garagemCompleta, spots: [...garagemCompleta.spots] };
const resultados = [];

console.log('\n🔄 SIMULAÇÃO: Sorteio sequencial de apartamentos');
console.log('=================================================');

// Sortear cada apartamento sequencialmente
for (const apartamento of apartamentos) {
    console.log(`\n📋 Sorteando apartamento ${apartamento.id}:`);

    const resultado = strategy.execute(apartamento, garagemAtual);

    console.log(`  Resultado: ${resultado.success ? 'SUCESSO' : 'FALHA'}`);

    if (resultado.success) {
        const tipo = resultado.spotType;
        console.log(`  ✅ Recebeu vaga ${resultado.vagaNumero} (tipo: ${tipo})`);
        console.log(`  ✅ Vaga ocupada: ${resultado.spot.id} → occupiedBy=${apartamento.id}`);

        // Atualizar garagem para próximo apartamento
        garagemAtual = resultado.garage;
        resultados.push(resultado);

    } else {
        console.log(`  ❌ Erro: ${resultado.error}`);
    }
}

console.log('\n🔍 VERIFICAÇÃO: Estado final da garagem');
console.log('========================================');

const vagasOcupadasFinal = garagemAtual.spots.filter(s => s.occupiedBy !== null);
console.log(`Total de vagas ocupadas: ${vagasOcupadasFinal.length}`);

vagasOcupadasFinal.forEach((vaga, index) => {
    const isExtended = vaga.reservedForExtended !== null;
    const tipoVaga = isExtended ? 'ESTENDIDA' : 'NORMAL';
    console.log(`  ${index + 1}. Vaga ${vaga.id}: occupiedBy=${vaga.occupiedBy} (${tipoVaga})`);
});

console.log('\n🔍 TESTE: Tentar reutilizar vagas já ocupadas (deve falhar)');
console.log('===========================================================');

let reutilizacoesFalharam = 0;
const apartamentosComVagas = resultados.filter(r => r.success);

// Testar apartamentos 303 e 403 que receberam vagas estendidas
const apartamentosParaTestar = [303, 403];

for (const apartmentId of apartamentosParaTestar) {
    console.log(`\n📋 Re-testando apartamento ${apartmentId}:`);

    const apartamento = { id: apartmentId, dupla: false };
    const novoResultado = strategy.execute(apartamento, garagemAtual);

    if (!novoResultado.success) {
        console.log(`  ✅ CORRETO: Falhou como esperado - ${novoResultado.error}`);
        reutilizacoesFalharam++;
    } else {
        console.log(`  ❌ ERRO: Conseguiu vaga novamente! Vaga ${novoResultado.vagaNumero}`);
    }
}

console.log('\n🎯 RESUMO FINAL DA TASK 5:');
console.log('===========================');
console.log(`✅ Apartamentos sorteados: ${resultados.length}`);
console.log(`✅ Vagas marcadas como ocupadas: ${vagasOcupadasFinal.length}`);
console.log(`✅ Tentativas de reutilização falharam: ${reutilizacoesFalharam}/${apartamentosParaTestar.length}`);

// Verificações específicas
const vagasEstendidasOcupadas = vagasOcupadasFinal.filter(v => v.reservedForExtended !== null);
const vagasNormaisOcupadas = vagasOcupadasFinal.filter(v => v.reservedForExtended === null);

console.log(`✅ Vagas estendidas ocupadas: ${vagasEstendidasOcupadas.length}`);
console.log(`✅ Vagas normais ocupadas: ${vagasNormaisOcupadas.length}`);

if (vagasOcupadasFinal.length === resultados.length && reutilizacoesFalharam === apartamentosParaTestar.length) {
    console.log('\n🚀 TASK 5 TOTALMENTE CONFIRMADA: Sistema funciona perfeitamente!');
    console.log('   ✅ Vagas estendidas marcadas como occupiedBy corretamente');
    console.log('   ✅ Prevenção de reutilização funcionando');
    console.log('   ✅ Estado da garagem mantido consistente');
} else {
    console.log('\n❌ PROBLEMAS DETECTADOS na implementação');
}

console.log('\n');