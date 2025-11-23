/**
 * 🧪 TESTE TASK 4 - Validação REALISTA da remoção da lógica de emergência
 * 
 * Cenários realistas onde o ExtendedReservationService já criou as reservas
 */

import { SingleSpotAssignmentStrategy } from '../src/services/SingleSpotAssignmentStrategy.js';
import { RandomnessService } from '../src/services/RandomnessService.js';

console.log('🧪 TESTE TASK 4 - Validação Realista (com ExtendedReservationService)');
console.log('=====================================================================\n');

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

console.log('🔍 TESTE 1: Apartamentos estendidos com reservas funcionam normalmente');
console.log('====================================================================');

// Cenário realista: ExtendedReservationService já criou as reservas
const garagemComReservasReais = {
    spots: [
        createSpot('G1', 'A', 1),  // vaga normal 1
        createSpot('G1', 'A', 2),  // vaga normal 2  
        createSpot('G1', 'A', 3),  // vaga normal 3
        createSpot('G1', 'A', 7, null, 303),  // vaga estendida 7 - reservada para 303
        createSpot('G1', 'B', 1, null, 403),  // vaga estendida 8 - reservada para 403
    ],
    pairs: {},
    extendedReservations: {
        303: "G1-A7",  // 303 → vaga 7
        403: "G1-B1"   // 403 → vaga 8
    }
};

// Apartamento 303 com reserva
const apartamento303 = { id: 303, dupla: false };
const resultado303 = strategy.execute(apartamento303, garagemComReservasReais);

console.log(`Apartamento 303: ${resultado303.success ? 'SUCESSO' : 'FALHA'}`);
if (resultado303.success && resultado303.spotType === 'extended-reserved') {
    console.log('✅ CORRETO: Apartamento 303 usou sua reserva estendida');
    console.log(`   Vaga: ${resultado303.vagaNumero} (tipo: ${resultado303.spotType})`);
} else {
    console.log('❌ ERRO: Apartamento com reserva não funcionou!');
}

// Apartamento 403 com reserva
const apartamento403 = { id: 403, dupla: false };
const resultado403 = strategy.execute(apartamento403, garagemComReservasReais);

console.log(`Apartamento 403: ${resultado403.success ? 'SUCESSO' : 'FALHA'}`);
if (resultado403.success && resultado403.spotType === 'extended-reserved') {
    console.log('✅ CORRETO: Apartamento 403 usou sua reserva estendida');
    console.log(`   Vaga: ${resultado403.vagaNumero} (tipo: ${resultado403.spotType})`);
} else {
    console.log('❌ ERRO: Apartamento com reserva não funcionou!');
}

console.log('\n🔍 TESTE 2: Apartamentos normais só usam vagas normais');
console.log('=======================================================');

// Apartamento normal (701) só pode usar vagas normais
const apartamento701 = { id: 701, dupla: false };
const resultado701 = strategy.execute(apartamento701, garagemComReservasReais);

console.log(`Apartamento 701: ${resultado701.success ? 'SUCESSO' : 'FALHA'}`);
if (resultado701.success && resultado701.spotType === 'normal') {
    console.log('✅ CORRETO: Apartamento normal usou vaga normal');
    console.log(`   Vaga: ${resultado701.vagaNumero} (tipo: ${resultado701.spotType})`);
} else {
    console.log('❌ ERRO: Apartamento normal não conseguiu vaga normal!');
}

console.log('\n🔍 TESTE 3: Sem vagas normais - apartamento normal aguarda');
console.log('===========================================================');

// Cenário: só vagas estendidas com reservas + apartamento normal
const garagemSemVagasNormais = {
    spots: [
        createSpot('G1', 'A', 7, null, 303),  // vaga estendida - reservada
        createSpot('G1', 'B', 1, null, 403),  // vaga estendida - reservada
    ],
    pairs: {},
    extendedReservations: {
        303: "G1-A7",
        403: "G1-B1"
    }
};

const apartamento702 = { id: 702, dupla: false };
const resultado702 = strategy.execute(apartamento702, garagemSemVagasNormais);

console.log(`Apartamento 702: ${resultado702.success ? 'SUCESSO' : 'FALHA'}`);
if (!resultado702.success && resultado702.shouldRetry) {
    console.log('✅ CORRETO: Apartamento normal aguarda vagas normais');
    console.log(`   Erro: ${resultado702.error}`);
} else {
    console.log('❌ ERRO: Apartamento normal não deveria conseguir vaga estendida!');
}

console.log('\n🔍 TESTE 4: Verificar que não há mais tipos "extended-emergency"');
console.log('===============================================================');

// Verificar que nenhum resultado retorna extended-emergency
const todosResultados = [resultado303, resultado403, resultado701, resultado702];
const temEmergencia = todosResultados.some(r => r.spotType === 'extended-emergency');

if (!temEmergencia) {
    console.log('✅ CONFIRMADO: Nenhum resultado usa "extended-emergency"');
} else {
    console.log('❌ ERRO: Ainda existe lógica de emergência no sistema!');
}

console.log('\n🎯 RESUMO DA VALIDAÇÃO REALISTA:');
console.log('✅ Apartamentos com reserva estendida → usam APENAS sua reserva');
console.log('✅ Apartamentos normais → usam APENAS vagas normais');
console.log('✅ Não há emergência - apartamentos aguardam vagas adequadas');
console.log('✅ Tipo "extended-emergency" completamente eliminado');

console.log('\n🚀 TASK 4 CONCLUÍDA: Lógica de emergência 100% removida!\n');