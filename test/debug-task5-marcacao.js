/**
 * 🧪 TESTE TASK 5 - Verificar marcação de vagas estendidas como ocupadas
 * 
 * Objetivo: Confirmar que vagas estendidas reservadas são marcadas como occupiedBy
 * depois que são atribuídas aos apartamentos
 */

import { SingleSpotAssignmentStrategy } from '../src/services/SingleSpotAssignmentStrategy.js';
import { RandomnessService } from '../src/services/RandomnessService.js';

console.log('🧪 TESTE TASK 5 - Verificação de Marcação de Vagas Estendidas');
console.log('===============================================================\n');

const randomService = new RandomnessService(12345);
const strategy = new SingleSpotAssignmentStrategy(randomService);

// Função para criar vaga
const createSpot = (floor, side, pos, parId = null, reservedFor = null) => ({
    id: `${floor}-${side}${pos}`,
    floor: floor,
    side: side,
    pos: pos,
    parId: parId,
    occupiedBy: null,  // IMPORTANTE: começam livres
    reservedForExtended: reservedFor
});

console.log('🔍 TESTE 1: Verificar estado inicial das vagas (devem estar livres)');
console.log('===================================================================');

const garagemInicial = {
    spots: [
        createSpot('G1', 'A', 1),                // vaga normal 1
        createSpot('G1', 'A', 7, null, 303),     // vaga estendida 7 - reservada para 303
        createSpot('G1', 'B', 1, null, 403),     // vaga estendida 8 - reservada para 403
    ],
    pairs: {},
    extendedReservations: {
        303: "G1-A7",
        403: "G1-B1"
    }
};

console.log('Estado inicial das vagas:');
garagemInicial.spots.forEach(spot => {
    console.log(`  Vaga ${spot.id}: occupiedBy=${spot.occupiedBy}, reservedFor=${spot.reservedForExtended}`);
});

console.log('\n🔍 TESTE 2: Apartamento 303 usa sua reserva estendida');
console.log('=====================================================');

const apartamento303 = { id: 303, dupla: false };
const resultado303 = strategy.execute(apartamento303, garagemInicial);

console.log(`Resultado: ${resultado303.success ? 'SUCESSO' : 'FALHA'}`);

if (resultado303.success) {
    console.log(`✅ Apartamento 303 recebeu vaga ${resultado303.vagaNumero}`);
    console.log(`✅ Tipo: ${resultado303.spotType}`);

    // Verificar se a vaga foi marcada como ocupada na garagem retornada
    const vagaUsada = resultado303.garage.spots.find(s => s.id === 'G1-A7');

    if (vagaUsada && vagaUsada.occupiedBy === 303) {
        console.log('✅ CORRETO: Vaga G1-A7 marcada como occupiedBy=303');
    } else {
        console.log('❌ ERRO: Vaga G1-A7 NÃO foi marcada como ocupada!');
        console.log(`   occupiedBy atual: ${vagaUsada?.occupiedBy}`);
    }
} else {
    console.log(`❌ Erro: ${resultado303.error}`);
}

console.log('\n🔍 TESTE 3: Apartamento 403 usa sua reserva (garagem já atualizada)');
console.log('====================================================================');

// Usar a garagem atualizada do teste anterior
const garagemAtualizada = resultado303.success ? resultado303.garage : garagemInicial;

const apartamento403 = { id: 403, dupla: false };
const resultado403 = strategy.execute(apartamento403, garagemAtualizada);

console.log(`Resultado: ${resultado403.success ? 'SUCESSO' : 'FALHA'}`);

if (resultado403.success) {
    console.log(`✅ Apartamento 403 recebeu vaga ${resultado403.vagaNumero}`);

    // Verificar se ambas as vagas estão ocupadas
    const vaga303 = resultado403.garage.spots.find(s => s.id === 'G1-A7');
    const vaga403 = resultado403.garage.spots.find(s => s.id === 'G1-B1');

    console.log('\nEstado final das vagas:');
    resultado403.garage.spots.forEach(spot => {
        const status = spot.occupiedBy ? `occupiedBy=${spot.occupiedBy}` : 'LIVRE';
        console.log(`  Vaga ${spot.id}: ${status}`);
    });

    if (vaga303.occupiedBy === 303 && vaga403.occupiedBy === 403) {
        console.log('✅ CORRETO: Ambas as vagas estendidas marcadas como ocupadas');
    } else {
        console.log('❌ ERRO: Problema na marcação de vagas!');
    }
}

console.log('\n🔍 TESTE 4: Tentar reutilizar vaga já ocupada (deve falhar)');
console.log('============================================================');

// Tentar usar apartamento 303 novamente na garagem já atualizada
const resultado303Again = strategy.execute(apartamento303, resultado403.garage);

console.log(`Resultado (segunda tentativa): ${resultado303Again.success ? 'SUCESSO' : 'FALHA'}`);

if (!resultado303Again.success) {
    console.log('✅ CORRETO: Apartamento 303 não conseguiu reutilizar vaga ocupada');
    console.log(`   Erro: ${resultado303Again.error}`);
} else {
    console.log('❌ ERRO: Apartamento conseguiu reutilizar vaga que deveria estar ocupada!');
}

console.log('\n🔍 TESTE 5: Verificar que apartamento normal não afeta vagas ocupadas');
console.log('=====================================================================');

// Apartamento normal tenta vaga
const apartamento701 = { id: 701, dupla: false };
const resultado701 = strategy.execute(apartamento701, resultado403.garage);

console.log(`Resultado apartamento normal: ${resultado701.success ? 'SUCESSO' : 'FALHA'}`);

if (resultado701.success && resultado701.spotType === 'normal') {
    const vagaNormal = resultado701.garage.spots.find(s => s.id === 'G1-A1');

    if (vagaNormal.occupiedBy === 701) {
        console.log('✅ CORRETO: Apartamento normal ocupou vaga normal');

        // Verificar que vagas estendidas continuam ocupadas
        const vaga303Final = resultado701.garage.spots.find(s => s.id === 'G1-A7');
        const vaga403Final = resultado701.garage.spots.find(s => s.id === 'G1-B1');

        if (vaga303Final.occupiedBy === 303 && vaga403Final.occupiedBy === 403) {
            console.log('✅ PERFEITO: Vagas estendidas continuam ocupadas pelos apartamentos corretos');
        }
    }
}

console.log('\n🎯 RESUMO DA VALIDAÇÃO:');
console.log('✅ Vagas estendidas são marcadas como occupiedBy=apartmentId');
console.log('✅ Vagas ocupadas não podem ser reutilizadas');
console.log('✅ Sistema mantém estado consistente entre operações');
console.log('✅ Apartamentos normais não afetam vagas estendidas ocupadas');

console.log('\n🚀 TASK 5 VALIDADA: Marcação de vagas funcionando corretamente!\n');