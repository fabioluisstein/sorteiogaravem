/**
 * 🧪 TESTE - Integração do ExtendedReservationService no LotteryService
 * Valida se as reservas estendidas estão sendo criadas no início do sorteio
 */

import { LotteryService } from '../src/services/LotteryService.js';
import { sorteioConfig } from '../src/config/sorteioConfig.js';

console.log('\n🧪 TESTE - Integração ExtendedReservationService');
console.log('================================================\n');

// Configurar sistema
await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
apartamentos_vagas_duplas=101,102
`);

console.log('✅ Configuração carregada');

// Função auxiliar para criar vaga
function createSpot(floor, side, pos) {
    return {
        id: `${floor}-${side}${pos}`,
        floor: floor,
        side: side,
        pos: pos,
        parId: null
    };
}

// Simular apartamentos
const mockApartments = [
    { id: 101, dupla: true, sorteado: false, vagas: [], ativo: true },   // Duplo
    { id: 102, dupla: true, sorteado: false, vagas: [], ativo: true },   // Duplo
    { id: 303, dupla: false, sorteado: false, vagas: [], ativo: true },  // Estendido
    { id: 403, dupla: false, sorteado: false, vagas: [], ativo: true },  // Estendido
    { id: 503, dupla: false, sorteado: false, vagas: [], ativo: true },  // Estendido
    { id: 701, dupla: false, sorteado: false, vagas: [], ativo: true }   // Simples
];

// Simular garagem com vagas estendidas + pares duplos
const mockGarage = {
    spots: [
        // Vagas estendidas (números 7, 8, 21, 22, 35, 36)
        createSpot('G1', 'A', 7),    // 7 - estendida
        createSpot('G1', 'B', 1),    // 8 - estendida
        createSpot('G2', 'C', 7),    // 21 - estendida  
        createSpot('G2', 'D', 1),    // 22 - estendida
        createSpot('G3', 'E', 7),    // 35 - estendida
        createSpot('G3', 'F', 1),    // 36 - estendida

        // Pares para duplas
        createSpot('G1', 'A', 1),    // 1
        createSpot('G1', 'A', 2),    // 2
        createSpot('G1', 'A', 3),    // 3  
        createSpot('G1', 'A', 4),    // 4

        // Vagas normais
        createSpot('G1', 'A', 5),    // 5
        createSpot('G1', 'A', 6),    // 6
    ],
    pairs: {
        'G1-A1-A2': { id: 'G1-A1-A2', aId: 'G1-A1', bId: 'G1-A2', reservedFor: null },
        'G1-A3-A4': { id: 'G1-A3-A4', aId: 'G1-A3', bId: 'G1-A4', reservedFor: null }
    },
    extendedReservations: {}
};

console.log('📊 Dados de entrada:');
console.log('   Apartamentos duplos:', mockApartments.filter(apt => apt.dupla).map(apt => apt.id));
console.log('   Apartamentos estendidos:', mockApartments.filter(apt => !apt.dupla && [303, 403, 503].includes(apt.id)).map(apt => apt.id));
console.log('   Apartamentos simples:', mockApartments.filter(apt => !apt.dupla && ![303, 403, 503].includes(apt.id)).map(apt => apt.id));

// Criar serviço de sorteio
const lotteryService = new LotteryService();
lotteryService.setSeed(12345);

console.log('\n🔍 TESTE 1: Verificar pré-processamento de reservas duplas');
const preprocessDoubleResult = lotteryService.preprocessDoubleReservations(mockApartments, mockGarage);
console.log('Resultado duplas:', preprocessDoubleResult.success ? 'SUCESSO' : 'FALHA');
if (preprocessDoubleResult.success) {
    console.log('Reservas duplas criadas:', Object.keys(preprocessDoubleResult.reservations).length);
    for (const [aptId, pairId] of Object.entries(preprocessDoubleResult.reservations)) {
        console.log(`   Apartamento ${aptId} → Par ${pairId}`);
    }
}

console.log('\n🔍 TESTE 2: Verificar pré-processamento de reservas estendidas');
const preprocessExtendedResult = lotteryService.preprocessExtendedReservations(mockApartments, mockGarage);
console.log('Resultado estendidas:', preprocessExtendedResult.success ? 'SUCESSO' : 'FALHA');
if (preprocessExtendedResult.success) {
    console.log('Reservas estendidas criadas:', Object.keys(preprocessExtendedResult.reservations).length);
    for (const [aptId, spotId] of Object.entries(preprocessExtendedResult.reservations)) {
        console.log(`   Apartamento ${aptId} → Vaga ${spotId}`);
    }
}

console.log('\n🔍 TESTE 3: Executar sorteio completo (drawOne)');
try {
    const drawResult = lotteryService.drawOne(mockApartments, mockGarage);
    console.log('Resultado do sorteio:', drawResult.success ? 'SUCESSO' : 'FALHA');

    if (drawResult.success) {
        console.log(`Apartamento sorteado: ${drawResult.apartment.id}`);
        console.log(`Tipo: ${drawResult.apartment.dupla ? 'duplo' : 'simples'}`);
        if (drawResult.vagas) {
            console.log(`Vagas atribuídas: ${drawResult.vagas.join(', ')}`);
        }
    } else {
        console.log('Erro:', drawResult.error);
    }

    // Verificar se as reservas estão no contexto do LotteryService
    console.log('\n📋 Estado das reservas no LotteryService:');
    console.log('Reservas duplas:', Object.keys(lotteryService.reservations).length);
    console.log('Reservas estendidas:', Object.keys(lotteryService.extendedReservations).length);

} catch (error) {
    console.log('❌ Erro durante execução:', error.message);
}

console.log('\n✨ TESTE CONCLUÍDO!\n');