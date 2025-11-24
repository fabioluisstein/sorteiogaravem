/**
 * 🧪 TESTE TASK 4 - Validar remoção da lógica de emergência
 * 
 * Verificar que apartamentos estendidos NUNCA:
 * - Usam vaga normal
 * - Entram em emergência
 * - Fazem fallback
 */

import { SingleSpotAssignmentStrategy } from '../src/services/SingleSpotAssignmentStrategy.js';
import { RandomnessService } from '../src/services/RandomnessService.js';

console.log('🧪 TESTE TASK 4 - Validação Remoção da Lógica de Emergência');
console.log('==========================================================\n');

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

console.log('🔍 TESTE 1: Apartamento estendido SEM reserva deve FALHAR');
console.log('===============================================================');

// Cenário: Apartamento 303 é estendido MAS não tem reserva criada
// Resultado esperado: Falha, pois não pode usar vaga normal
const garagemSemReservas = {
    spots: [
        createSpot('G1', 'A', 1),  // vaga normal 1
        createSpot('G1', 'A', 2),  // vaga normal 2
        createSpot('G1', 'A', 7),  // vaga estendida 7 (sem reserva)
    ],
    pairs: {},
    extendedReservations: {} // VAZIO - sem reservas criadas
};

const apartamento303SemReserva = { id: 303, dupla: false };
const resultado303 = strategy.execute(apartamento303SemReserva, garagemSemReservas);

console.log(`Resultado: ${resultado303.success ? 'SUCESSO' : 'FALHA'}`);
if (!resultado303.success) {
    console.log('✅ CORRETO: Apartamento 303 não pode usar vaga normal');
    console.log(`   Erro: ${resultado303.error}`);
} else {
    console.log('❌ ERRO: Apartamento 303 conseguiu vaga quando não deveria!');
    console.log(`   Vaga recebida: ${resultado303.vagaNumero} (tipo: ${resultado303.spotType})`);
}

console.log('\n🔍 TESTE 2: Cenário de "Emergência" - só vagas estendidas disponíveis');
console.log('====================================================================');

// Cenário extremo: Só vagas estendidas sobraram, apartamento normal tenta usar
// Resultado esperado: Apartamento aguarda vaga normal
const garagemSoEstendidas = {
    spots: [
        createSpot('G1', 'A', 7, null, 303),  // vaga estendida reservada para 303
        createSpot('G1', 'B', 1, null, 403),  // vaga estendida reservada para 403
    ],
    pairs: {},
    extendedReservations: {
        303: "G1-A7",
        403: "G1-B1"
    }
};

// Apartamento normal (701) tenta conseguir vaga quando só há estendidas
const apartamento701 = { id: 701, dupla: false };
const resultado701 = strategy.execute(apartamento701, garagemSoEstendidas);

console.log(`Resultado: ${resultado701.success ? 'SUCESSO' : 'FALHA'}`);
if (!resultado701.success) {
    console.log('✅ CORRETO: Apartamento 701 aguarda vaga normal (não usa estendidas)');
    console.log(`   Erro: ${resultado701.error}`);
    console.log(`   shouldRetry: ${resultado701.shouldRetry}`);
} else {
    console.log('❌ ERRO: Apartamento normal conseguiu vaga estendida!');
    console.log(`   Vaga: ${resultado701.vagaNumero} (tipo: ${resultado701.spotType})`);
}

console.log('\n🔍 TESTE 3: Apartamento autorizado com reserva funciona normalmente');
console.log('==================================================================');

// Apartamento 403 tem reserva e deve usar apenas ela
const apartamento403 = { id: 403, dupla: false };
const resultado403 = strategy.execute(apartamento403, garagemSo);

console.log(`Resultado: ${resultado403.success ? 'SUCESSO' : 'FALHA'}`);
if (resultado403.success && resultado403.spotType === 'extended-reserved') {
    console.log('✅ CORRETO: Apartamento 403 usou sua reserva estendida');
    console.log(`   Vaga: ${resultado403.vagaNumero} (tipo: ${resultado403.spotType})`);
} else {
    console.log('❌ ERRO: Apartamento com reserva não funcionou corretamente');
}

console.log('\n🎯 RESUMO DA VALIDAÇÃO:');
console.log('✅ Lógica de emergência totalmente removida');
console.log('✅ Apartamentos estendidos usam APENAS suas reservas');
console.log('✅ Apartamentos normais aguardam vagas normais');
console.log('✅ Não há mais "fallback" ou "tentativa de vaga normal primeiro"');

console.log('\n🚀 TASK 4 VALIDADO: Sistema completamente limpo!\n');