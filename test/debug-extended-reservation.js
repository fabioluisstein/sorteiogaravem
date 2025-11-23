/**
 * 🧪 TESTE - ExtendedReservationService
 * Valida o funcionamento do serviço de reserva de vagas estendidas
 */

import { ExtendedReservationService } from '../src/services/ExtendedReservationService.js';
import { RandomnessService } from '../src/services/RandomnessService.js';
import { sorteioConfig } from '../src/config/sorteioConfig.js';

console.log('\n🧪 TESTE - ExtendedReservationService');
console.log('====================================\n');

// Configurar sistema
await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
`);

console.log('✅ Configuração carregada');
console.log('   Vagas estendidas:', sorteioConfig.vagasEstendidas);
console.log('   Apartamentos autorizados:', sorteioConfig.apartamentosVagasEstendidas);

// Criar serviço
const randomService = new RandomnessService(12345);
const extendedService = new ExtendedReservationService(randomService);

// Simular apartamentos
const mockApartments = [
    { id: 101, dupla: false, sorteado: false, vagas: [], ativo: true },
    { id: 303, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 403, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 503, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 603, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 703, dupla: false, sorteado: false, vagas: [], ativo: true }, // Autorizado
    { id: 704, dupla: false, sorteado: false, vagas: [], ativo: true }
];

// Simular garagem com vagas estendidas livres
const mockGarage = {
    spots: [
        // Vagas normais
        { id: 'G1-A1', floor: 'G1', side: 'A', pos: 1, parId: null },
        { id: 'G1-A2', floor: 'G1', side: 'A', pos: 2, parId: null },

        // Vagas estendidas livres (do arquivo: 7,8,21,22,35,36)
        { id: 'G1-A7', floor: 'G1', side: 'A', pos: 7, parId: null }, // Vaga estendida
        { id: 'G1-B8', floor: 'G1', side: 'B', pos: 8, parId: null }, // Vaga estendida
        { id: 'G2-C21', floor: 'G2', side: 'C', pos: 21, parId: null }, // Vaga estendida
        { id: 'G2-D22', floor: 'G2', side: 'D', pos: 22, parId: null }, // Vaga estendida
        { id: 'G3-E35', floor: 'G3', side: 'E', pos: 35, parId: null }, // Vaga estendida
        { id: 'G3-F36', floor: 'G3', side: 'F', pos: 36, parId: null }, // Vaga estendida

        // Outras vagas
        { id: 'G1-A3', floor: 'G1', side: 'A', pos: 3, parId: null }
    ],
    pairs: {},
    extendedReservations: {}
};

console.log('\n🔍 TESTE 1: Identificar apartamentos com direito a estendidas');
const extendedApartments = extendedService.getExtendedApartments(mockApartments);
console.log('Apartamentos com direito a estendidas:', extendedApartments.map(apt => apt.id));
console.log('Esperado: [303, 403, 503, 603, 703]');

console.log('\n🔍 TESTE 2: Identificar vagas estendidas livres');
const freeExtendedSpots = extendedService.getFreeExtendedSpots(mockGarage);
console.log('Vagas estendidas livres:', freeExtendedSpots.map(spot => `${spot.floor}-${spot.side}${spot.pos}`));
console.log('Esperado: [G1-A7, G1-B8, G2-C21, G2-D22, G3-E35, G3-F36]');

console.log('\n🔍 TESTE 3: Processar reservas');
const resultado = extendedService.processReservations(mockApartments, mockGarage);

console.log('Resultado do processamento:', resultado.success ? 'SUCESSO' : 'FALHA');
if (resultado.success) {
    console.log('Reservas criadas:', Object.keys(resultado.reservations).length);
    console.log('Mapeamento apartamento → vaga:');
    for (const [apartmentId, spotId] of Object.entries(resultado.reservations)) {
        console.log(`   Apartamento ${apartmentId} → Vaga ${spotId}`);
    }
} else {
    console.log('Erro:', resultado.error);
}

console.log('\n🔍 TESTE 4: Aplicar reservas na garagem');
if (resultado.success) {
    const garagemComReservas = extendedService.applyReservations(mockGarage, resultado.reservations);

    console.log('Reservas aplicadas no campo extendedReservations:');
    console.log(garagemComReservas.extendedReservations);

    console.log('\nVagas marcadas como reservadas:');
    const spotsReservados = garagemComReservas.spots.filter(spot => spot.reservedForExtended);
    spotsReservados.forEach(spot => {
        console.log(`   Vaga ${spot.floor}-${spot.side}${spot.pos} → reservada para apartamento ${spot.reservedForExtended}`);
    });
}

console.log('\n🎯 FORMATO FINAL DO CONTEXTO:');
if (resultado.success) {
    console.log('context.extendedReservations = {');
    for (const [apartmentId, spotId] of Object.entries(resultado.reservations)) {
        console.log(`  ${apartmentId}: "${spotId}",`);
    }
    console.log('}');
}

console.log('\n✨ TESTE CONCLUÍDO!\n');