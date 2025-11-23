/**
 * 🧪 TESTE: PROTEÇÃO DE PARES CONTRA APARTAMENTOS SIMPLES
 * 
 * Verifica se apartamentos simples não conseguem ocupar vagas
 * que fazem parte de pares necessários para apartamentos duplos
 */

import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { Apartment } from './src/core/models/Apartment.js';

console.log('🧪 ===== TESTE: PROTEÇÃO DE PARES =====\n');

// 1. Criar garagem com pares específicos
const spots = [
    new Spot(1, 'G1', 'A', 1),   // Posição 1
    new Spot(2, 'G1', 'A', 2),   // Posição 2  -> Par 1-2
    new Spot(3, 'G1', 'A', 3),   // Posição 3
    new Spot(4, 'G1', 'A', 4),   // Posição 4  -> Par 3-4
    new Spot(5, 'G1', 'A', 5),   // Posição 5
    new Spot(6, 'G1', 'A', 6),   // Posição 6  -> Par 5-6
    new Spot(7, 'G1', 'A', 7),   // Posição 7 (individual)
    new Spot(40, 'G3', 'F', 5),  // Vaga 40 (posição 5)
    new Spot(41, 'G3', 'F', 6)   // Vaga 41 (posição 6) -> Par 40-41
];

const pairs = {
    'PAR1': { id: 'PAR1', floor: 'G1', side: 'A', aPos: 1, bPos: 2, aId: 1, bId: 2 },
    'PAR2': { id: 'PAR2', floor: 'G1', side: 'A', aPos: 3, bPos: 4, aId: 3, bId: 4 },
    'PAR3': { id: 'PAR3', floor: 'G1', side: 'A', aPos: 5, bPos: 6, aId: 5, bId: 6 },
    'PAR4': { id: 'PAR4', floor: 'G3', side: 'F', aPos: 5, bPos: 6, aId: 40, bId: 41 }
};

const garage = new Garage(spots, pairs);

// 2. Simular pré-reserva para apartamentos duplos
garage.doublePairReservations['PAR1'] = { priority: 'double', reservedAt: new Date() };
garage.doublePairReservations['PAR2'] = { priority: 'double', reservedAt: new Date() };
// PAR3 e PAR4 ficam livres mas ainda necessários

console.log('📊 Estado inicial:');
console.log(`   Pares pré-reservados: ${Object.keys(garage.doublePairReservations).length}`);
console.log(`   Pares livres totais: ${garage.getFreePairs().length}`);

// 3. Função mock para vagas estendidas (nenhuma é estendida neste teste)
const isExtendedSpot = (spotId) => false;

// 4. Testar vagas disponíveis para apartamentos simples
const vagasParaSimples = garage.getFreeNormalSpots(isExtendedSpot);

console.log(`\n🏢 Vagas disponíveis para apartamentos simples:`);
console.log(`   Total: ${vagasParaSimples.length}`);
vagasParaSimples.forEach(spot => {
    console.log(`   - Vaga ${spot.id} (posição ${spot.pos})`);
});

// 5. Verificar proteção específica das vagas críticas
const vagasCriticas = [1, 2, 3, 4, 5, 6, 40, 41];
console.log(`\n🛡️ Verificação de proteção:`);

vagasCriticas.forEach(vagaId => {
    const vaga = spots.find(s => s.id === vagaId);
    const estaProtegida = !vagasParaSimples.includes(vaga);
    const fazParteDePar = garage.isPartOfValidNaturalPair(vaga);

    console.log(`   Vaga ${vagaId} (pos ${vaga.pos}): ${estaProtegida ? '🛡️ PROTEGIDA' : '🟢 DISPONÍVEL'} | Par natural: ${fazParteDePar ? 'Sim' : 'Não'}`);
});

// 6. Simular tentativa de sortear apartamento simples
const apartamentoSimples = new Apartment(999, false); // Apartamento simples

console.log(`\n🎲 Simulação de sorteio para apartamento simples:`);
const opcoesDisponiveisSimples = garage.getAvailableOptionsForApartment(apartamentoSimples, isExtendedSpot, null);

console.log(`   Tipo detectado: ${opcoesDisponiveisSimples.type}`);
console.log(`   Vagas disponíveis: ${opcoesDisponiveisSimples.spots.length}`);

if (opcoesDisponiveisSimples.spots.length > 0) {
    console.log(`   Vagas oferecidas:`);
    opcoesDisponiveisSimples.spots.forEach(spot => {
        console.log(`     - Vaga ${spot.id} (posição ${spot.pos})`);
    });
} else {
    console.log(`   ✅ CORRETO: Nenhuma vaga disponível (todas protegidas)`);
}

// 7. Simular um sorteio duplo para liberar pares
console.log(`\n🎲 Simulando sorteio duplo (liberar PAR1):`);
delete garage.doublePairReservations['PAR1'];
garage.occupySpot(1, 101); // Apartamento duplo ocupa par 1-2
garage.occupySpot(2, 101);

// 8. Verificar vagas simples após sorteio duplo
const vagasAposLiberacao = garage.getFreeNormalSpots(isExtendedSpot);
console.log(`\n🔄 Após sorteio duplo (PAR1 usado):`);
console.log(`   Vagas para simples: ${vagasAposLiberacao.length}`);

// Se ainda há apartamentos duplos pendentes (PAR2 reservado), 
// vagas dos pares livres (PAR3, PAR4) devem permanecer protegidas
const aindaTemDuplosReservados = Object.keys(garage.doublePairReservations).length > 0;
console.log(`   Ainda há apartamentos duplos reservados: ${aindaTemDuplosReservados}`);

if (aindaTemDuplosReservados && vagasAposLiberacao.length === 1) {
    console.log(`   ✅ CORRETO: Apenas vaga 7 (individual) disponível para simples`);
} else if (!aindaTemDuplosReservados && vagasAposLiberacao.length > 1) {
    console.log(`   ✅ CORRETO: Mais vagas liberadas após todos os duplos serem atendidos`);
} else {
    console.log(`   ❌ PROBLEMA: Proteção não está funcionando corretamente`);
}

console.log('\n🧪 ===== FIM DO TESTE =====');