/**
 * 🧪 TESTE - SingleSpotAssignmentStrategy com Reservas Estendidas
 * Valida se apartamentos estendidos usam APENAS suas reservas
 */

import { SingleSpotAssignmentStrategy } from '../src/services/SingleSpotAssignmentStrategy.js';
import { RandomnessService } from '../src/services/RandomnessService.js';
import { sorteioConfig, positionToSequentialNumber } from '../src/config/sorteioConfig.js';

console.log('\n🧪 TESTE - SingleSpotAssignmentStrategy com Reservas Estendidas');
console.log('=============================================================\n');

// Configurar sistema
await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
`);

// Função auxiliar para criar vaga
function createSpot(floor, side, pos, occupiedBy = null, reservedForExtended = null) {
    return {
        id: `${floor}-${side}${pos}`,
        floor: floor,
        side: side,
        pos: pos,
        parId: null,
        occupiedBy: occupiedBy,
        reservedForExtended: reservedForExtended
    };
}

console.log('✅ Configuração carregada');

// Criar strategy
const randomService = new RandomnessService(12345);
const strategy = new SingleSpotAssignmentStrategy(randomService);

console.log('\n🔍 TESTE 1: Apartamento com reserva estendida deve usar APENAS a reserva');

// Simular garagem com reservas estendidas aplicadas
const garagemComReservas = {
    spots: [
        // Vagas normais livres
        createSpot('G1', 'A', 1), // vaga 1 - normal livre
        createSpot('G1', 'A', 2), // vaga 2 - normal livre
        createSpot('G1', 'A', 3), // vaga 3 - normal livre

        // Vagas estendidas - algumas reservadas, algumas livres
        createSpot('G1', 'A', 7, null, 303),    // vaga 7 - reservada para 303
        createSpot('G1', 'B', 1, null, 403),    // vaga 8 - reservada para 403
        createSpot('G2', 'C', 7),                // vaga 21 - livre
        createSpot('G2', 'D', 1),                // vaga 22 - livre
    ],
    pairs: {},
    extendedReservations: {
        303: "G1-A7",  // Apartamento 303 → Vaga 7
        403: "G1-B1",  // Apartamento 403 → Vaga 8
    }
};

// Apartamento 303 tem reserva estendida
const apartamento303 = { id: 303, dupla: false };

console.log('📋 Testando apartamento 303 (tem reserva estendida)...');
const resultado303 = strategy.execute(apartamento303, garagemComReservas);

console.log('Resultado:', resultado303.success ? 'SUCESSO' : 'FALHA');
if (resultado303.success) {
    console.log(`   ✅ Apartamento ${resultado303.apartment.id} recebeu vaga ${resultado303.vagaNumero}`);
    console.log(`   ✅ Tipo: ${resultado303.spotType}`);
    console.log(`   ✅ Spot usado: ${resultado303.spot.id}`);

    // Verificar se NÃO usou vaga normal
    if (resultado303.vagaNumero === 7 && resultado303.spotType === 'extended-reserved') {
        console.log('   🎯 CORRETO: Apartamento usou sua reserva estendida, não vaga normal');
    } else {
        console.log('   🚨 ERRO: Apartamento não usou sua reserva estendida!');
    }
} else {
    console.log(`   ❌ Erro: ${resultado303.error}`);
}

console.log('\n🔍 TESTE 2: Apartamento SEM reserva estendida deve usar vaga normal');

// Apartamento 701 não tem reserva estendida
const apartamento701 = { id: 701, dupla: false };

console.log('📋 Testando apartamento 701 (NÃO tem reserva estendida)...');
const resultado701 = strategy.execute(apartamento701, garagemComReservas);

console.log('Resultado:', resultado701.success ? 'SUCESSO' : 'FALHA');
console.log('Debug resultado701:', JSON.stringify(resultado701, null, 2));

if (resultado701.success) {
    console.log(`   ✅ Apartamento 701 recebeu vaga ${resultado701.vagaNumero}`);
    console.log(`   ✅ Tipo: ${resultado701.spotType}`);
    console.log(`   ✅ Spot usado: ${resultado701.spot ? resultado701.spot.id : 'N/A'}`);

    // Verificar se usou vaga normal (1, 2 ou 3)
    if ([1, 2, 3].includes(resultado701.vagaNumero) && resultado701.spotType === 'normal') {
        console.log('   🎯 CORRETO: Apartamento sem reserva usou vaga normal');
    } else {
        console.log('   🚨 ERRO: Apartamento sem reserva não usou vaga normal!');
    }
} else {
    console.log(`   ❌ Erro: ${resultado701.error}`);
}

console.log('\n🔍 TESTE 3: Apartamento autorizado com reserva deve IGNORAR vagas normais');

console.log('📋 Cenário: Apartamento 403 tem reserva E há vagas normais livres...');

// Garagem com MUITAS vagas normais livres + reserva para 403
const garagemComMuitasVagasNormais = {
    spots: [
        // MUITAS vagas normais livres
        createSpot('G1', 'A', 1),
        createSpot('G1', 'A', 2),
        createSpot('G1', 'A', 3),
        createSpot('G1', 'A', 4),
        createSpot('G1', 'A', 5),

        // Reserva estendida do 403
        createSpot('G1', 'B', 1, null, 403),    // vaga 8 - reservada para 403
    ],
    pairs: {},
    extendedReservations: {
        403: "G1-B1",  // Apartamento 403 → Vaga 8
    }
};

const apartamento403 = { id: 403, dupla: false };
const resultado403 = strategy.execute(apartamento403, garagemComMuitasVagasNormais);

console.log('Resultado:', resultado403.success ? 'SUCESSO' : 'FALHA');
if (resultado403.success) {
    console.log(`   Apartamento 403 recebeu vaga ${resultado403.vagaNumero}`);
    console.log(`   Tipo: ${resultado403.spotType}`);

    if (resultado403.vagaNumero === 8 && resultado403.spotType === 'extended-reserved') {
        console.log('   🎯 PERFEITO: Apartamento IGNOROU vagas normais e usou sua reserva!');
    } else {
        console.log('   🚨 ERRO: Apartamento não priorizou sua reserva estendida!');
    }
}

console.log('\n🎯 RESUMO DA NOVA LÓGICA:');
console.log('✅ Apartamentos com reserva estendida → usam APENAS a reserva');
console.log('✅ Apartamentos sem reserva → usam vagas normais');
console.log('✅ Não há mais "fallback" ou "emergência" para apartamentos com reserva');
console.log('✅ Apartamentos estendidos sempre têm vaga garantida (reserva)');

console.log('\n✨ TESTE CONCLUÍDO!\n');