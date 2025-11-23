/**
 * 🧪 TESTE CORRIGIDO - ExtendedReservationService
 * Com estrutura correta de vagas seguindo o mapeamento real do sistema
 */

import { ExtendedReservationService } from '../src/services/ExtendedReservationService.js';
import { RandomnessService } from '../src/services/RandomnessService.js';
import { sorteioConfig, positionToSequentialNumber } from '../src/config/sorteioConfig.js';

console.log('\n🧪 TESTE CORRIGIDO - ExtendedReservationService');
console.log('================================================\n');

// Configurar sistema
await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
`);

console.log('✅ Configuração carregada');
console.log('   Vagas estendidas:', sorteioConfig.vagasEstendidas);
console.log('   Apartamentos autorizados:', sorteioConfig.apartamentosVagasEstendidas);

// Função auxiliar para criar vaga com número sequencial correto
function createSpot(floor, side, pos) {
    const sequentialNumber = positionToSequentialNumber(floor, side, pos);
    return {
        id: `${floor}-${side}${pos}`,
        floor: floor,
        side: side,
        pos: pos,
        sequentialNumber: sequentialNumber,
        parId: null
    };
}

// Simular garagem com estrutura correta
console.log('\n📍 MAPEAMENTO DE VAGAS ESTENDIDAS:');
const mockGarage = {
    spots: [
        // Vagas estendidas corretas (números 7, 8, 21, 22, 35, 36)
        createSpot('G1', 'A', 7),    // Número 7
        createSpot('G1', 'B', 1),    // Número 8 (G1-B lado tem offset +7)
        createSpot('G2', 'C', 7),    // Número 21 (G2-C: 14 + 7 = 21)
        createSpot('G2', 'D', 1),    // Número 22 (G2-D: 14 + 7 + 1 = 22)
        createSpot('G3', 'E', 7),    // Número 35 (G3-E: 28 + 7 = 35)
        createSpot('G3', 'F', 1),    // Número 36 (G3-F: 28 + 7 + 1 = 36)

        // Algumas vagas normais para contexto
        createSpot('G1', 'A', 1),    // Número 1
        createSpot('G1', 'A', 2),    // Número 2
        createSpot('G2', 'C', 1),    // Número 15
    ],
    pairs: {},
    extendedReservations: {}
};

// Mostrar mapeamento para verificação
mockGarage.spots.forEach(spot => {
    console.log(`   ${spot.id} (${spot.floor}-${spot.side}${spot.pos}) → Número ${spot.sequentialNumber}`);
});

// Criar serviço e apartamentos
const randomService = new RandomnessService(12345);
const extendedService = new ExtendedReservationService(randomService);

const mockApartments = [
    { id: 101, dupla: false, sorteado: false, vagas: [], ativo: true },
    { id: 303, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 403, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 503, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 603, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 703, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 704, dupla: false, sorteado: false, vagas: [], ativo: true }
];

console.log('\n🔍 TESTE 1: Identificar apartamentos com direito a estendidas');
const extendedApartments = extendedService.getExtendedApartments(mockApartments);
console.log('Apartamentos com direito a estendidas:', extendedApartments.map(apt => apt.id));

console.log('\n🔍 TESTE 2: Identificar vagas estendidas livres');
const freeExtendedSpots = extendedService.getFreeExtendedSpots(mockGarage);
console.log('Vagas estendidas livres encontradas:', freeExtendedSpots.length);
freeExtendedSpots.forEach(spot => {
    console.log(`   ${spot.id} → Número ${spot.sequentialNumber}`);
});

console.log('\n🔍 TESTE 3: Processar reservas');
const resultado = extendedService.processReservations(mockApartments, mockGarage);

console.log('Resultado do processamento:', resultado.success ? 'SUCESSO' : 'FALHA');
if (resultado.success) {
    console.log('Reservas criadas:', Object.keys(resultado.reservations).length);
    console.log('\n📋 MAPEAMENTO APARTAMENTO → VAGA:');
    for (const [apartmentId, spotId] of Object.entries(resultado.reservations)) {
        console.log(`   Apartamento ${apartmentId} → Vaga ${spotId}`);
    }

    console.log('\n🎯 FORMATO FINAL DO CONTEXTO (context.extendedReservations):');
    console.log('{');
    for (const [apartmentId, spotId] of Object.entries(resultado.reservations)) {
        console.log(`  ${apartmentId}: "${spotId}",`);
    }
    console.log('}');
} else {
    console.log('Erro:', resultado.error);
}

console.log('\n✨ TESTE CONCLUÍDO!\n');