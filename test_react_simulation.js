/**
 * 🎯 TESTE: Simular Pré-reserva Exatamente Como no React
 */

import { LotterySystemFactory } from './src/core/index.js';
import { Garage } from './src/core/models/Garage.js';
import { Spot } from './src/core/models/Spot.js';
import { Apartment } from './src/core/models/Apartment.js'; // 🎯 NOVO
import { getVagasProibidasDuplo } from './src/config/sorteioConfig.js';

console.log('🧪 ===== TESTE: SIMULAÇÃO EXATA DO AMBIENTE REACT =====\n');

// 1. Simular criação da garagem exatamente como no React
function createGarage() {
    console.log('🏗️ Criando garagem simulando ambiente React...');

    const FLOORS = ["G1", "G2", "G3"];
    const SIDES_BY_FLOOR = { G1: ["A", "B"], G2: ["C", "D"], G3: ["E", "F"] };
    const POSITIONS = [1, 2, 3, 4, 5, 6, 7];
    const NATURAL_PAIRS = [[1, 2], [3, 4], [5, 6]];

    const spots = [];
    const pairs = {};

    // Função para converter posição em número sequencial (como no React)
    const positionToSequentialNumber = (floor, side, position) => {
        const FLOORS = ['G1', 'G2', 'G3'];
        const SIDES_BY_FLOOR = {
            'G1': ['A', 'B'],
            'G2': ['C', 'D'],
            'G3': ['E', 'F']
        };

        let baseId = 0;
        for (let f = 0; f < FLOORS.indexOf(floor); f++) {
            baseId += SIDES_BY_FLOOR[FLOORS[f]].length * 7; // 7 posições por lado
        }

        const sideIndex = SIDES_BY_FLOOR[floor].indexOf(side);
        baseId += sideIndex * 7;
        baseId += position;

        return baseId;
    };

    // Criar spots exatamente como no React
    for (const floor of FLOORS) {
        for (const side of SIDES_BY_FLOOR[floor]) {
            // Criar pares primeiro
            for (const [p1, p2] of NATURAL_PAIRS) {
                const parId = `${floor}-${side}-${p1}-${p2}`;
                const aId = positionToSequentialNumber(floor, side, p1);
                const bId = positionToSequentialNumber(floor, side, p2);

                pairs[parId] = {
                    id: parId,
                    aId,
                    bId,
                    floor,
                    side,
                    reservedFor: null
                };
            }

            // Criar spots
            for (const pos of POSITIONS) {
                const vagaId = positionToSequentialNumber(floor, side, pos);
                const naturalPair = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
                const [p1, p2] = naturalPair || [pos, pos];

                const spot = new Spot(vagaId, floor, side, pos, 'VAGA');
                spot.blocked = false;
                spot.occupiedBy = null;
                spot.parId = `${floor}-${side}-${p1}-${p2}`;

                spots.push(spot);
            }
        }
    }

    console.log(`   Criados ${spots.length} spots`);
    console.log(`   Criados ${Object.keys(pairs).length} pares`);

    return new Garage(spots, pairs);
}

// 2. Simular função isExtendedSpot como no React
const isVagaEstendida = (vagaId) => {
    const vagasEstendidas = [7, 8, 21, 22, 35, 36];
    return vagasEstendidas.includes(parseInt(vagaId));
};

// 3. Criar sistema de sorteio
const lotterySystem = LotterySystemFactory.createSystem({
    seed: Date.now(),
    isExtendedSpotFn: isVagaEstendida,
    isExtendedApartmentFn: (aptId) => [303, 403, 503, 603, 703].includes(aptId)
});

const garage = createGarage();

console.log('\n🔧 Testando getVagasProibidasDuplo():');
const vagasProibidas = getVagasProibidasDuplo();

console.log('\n🏠 Criando apartamentos duplos de teste:');
const apartamentosDuplos = [
    new Apartment(101, '101', true, true), // id, nome, ativo, dupla
    new Apartment(102, '102', true, true),
    new Apartment(103, '103', true, true),
    new Apartment(203, '203', true, true),
    new Apartment(301, '301', true, true),
    new Apartment(304, '304', true, true), // 🎯 Este é o problemático
];

console.log(`   Apartamentos duplos: ${apartamentosDuplos.length}`);

console.log('\n🎲 Executando múltiplos sorteios para simular problema...');

for (let tentativa = 1; tentativa <= 3; tentativa++) {
    console.log(`\n--- TENTATIVA ${tentativa} ---`);

    let garageTeste = garage.clone();
    const apartamentos = apartamentosDuplos.map(apt => apt.clone());

    let sucessos = 0;
    let falhas = 0;
    let resultadoApto304 = null;

    // Sorteio individual como no React  
    for (let i = 0; i < apartamentos.length; i++) {
        const apartamentosDisponiveis = apartamentos.filter(apt => apt.isAvailableForDraw());

        if (apartamentosDisponiveis.length === 0) break;

        // Executar sorteio de UM apartamento
        const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garageTeste);

        if (result.success) {
            // Marcar como sorteado
            const apartment = apartamentos.find(apt => apt.id === result.apartment.id);
            if (apartment) apartment.sorteado = true;

            // Aplicar resultado na garagem
            garageTeste = result.assignmentResult.garage;
            sucessos++;

            if (result.apartment.id === 304) {
                resultadoApto304 = { success: true, message: result.message };
            }
        } else {
            falhas++;
            if (result.apartment && result.apartment.id === 304) {
                resultadoApto304 = { success: false, message: result.message };
            }
            console.log(`      ❌ ${result.message}`);
        }
    } console.log(`📊 Resultado tentativa ${tentativa}:`);
    console.log(`   Sucessos: ${sucessos}`);
    console.log(`   Falhas: ${falhas}`);

    // Verificar se apto 304 foi sorteado com sucesso
    if (resultadoApto304) {
        console.log(`   🎯 Apto 304: ${resultadoApto304.success ? '✅ Sucesso' : '❌ Falha'} - ${resultadoApto304.message}`);
    } else {
        console.log(`   🎯 Apto 304: ❓ Não foi sorteado nesta tentativa`);
    }
}

console.log('\n🎯 ANÁLISE:');
console.log('Se o apto 304 estiver falhando consistentemente,');
console.log('significa que o filtro de vagas proibidas NÃO está funcionando no runtime real.');
console.log('\nVerifique:');
console.log('1. Se vagasProibidas chegou vazio no log da pré-reserva');
console.log('2. Se pares como G2-D-1-2 (22,23) estão sendo pré-reservados');
console.log('3. Se os logs mostram "Vagas proibidas para duplos:" vazio');