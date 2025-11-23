/**
 * @fileoverview Teste do método unificado de seleção de vagas
 * @description Valida se o novo método getAvailableOptionsForApartment funciona corretamente
 */

import { describe, test, beforeEach, expect } from 'vitest';
import { Garage } from '../../core/models/Garage.js';
import { Spot } from '../../core/models/Spot.js';
import { Apartment } from '../../core/models/Apartment.js';
import { LotterySystemFactory } from '../../core/index.js';

describe('🔧 UNIFICAÇÃO: Método unificado de seleção de vagas', () => {
    let lotterySystem;
    let apartamentos;
    let garagem;

    const positionToSequentialNumber = (floor, side, pos) => {
        const FLOORS = ['G1', 'G2', 'G3', 'G4'];
        const SIDES_BY_FLOOR = {
            'G1': ['A', 'B'],
            'G2': ['C', 'D'],
            'G3': ['E', 'F'],
            'G4': ['G']
        };

        let baseId = 0;
        for (let f = 0; f < FLOORS.indexOf(floor); f++) {
            baseId += SIDES_BY_FLOOR[FLOORS[f]].length * 7;
        }

        const sideIndex = SIDES_BY_FLOOR[floor].indexOf(side);
        baseId += sideIndex * 7;
        baseId += pos;

        return baseId;
    };

    const criarApartamentos = () => {
        const apts = [];
        // Apartamento simples, duplo e estendido para teste
        apts.push(new Apartment(101, '101', true, false)); // Simples
        apts.push(new Apartment(102, '102', true, true));  // Duplo
        apts.push(new Apartment(103, '103', true, false)); // Estendido (será detectado pela função)
        return apts;
    };

    const criarGaragem = () => {
        const spots = [];
        const pairs = {};

        const FLOORS = ['G1'];
        const SIDES_BY_FLOOR = { 'G1': ['A'] };
        const POSITIONS = [1, 2, 3, 4, 5, 6, 7];
        const NATURAL_PAIRS = [[1, 2], [3, 4], [5, 6]];

        for (const floor of FLOORS) {
            for (const side of SIDES_BY_FLOOR[floor]) {
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

                for (const pos of POSITIONS) {
                    const vagaId = positionToSequentialNumber(floor, side, pos);
                    const spot = new Spot(vagaId, floor, side, pos, 'VAGA');
                    spot.blocked = false;
                    spot.occupiedBy = null;
                    spots.push(spot);
                }
            }
        }

        return new Garage(spots, pairs);
    };

    const isVagaEstendida = (vagaId) => {
        return vagaId === 7; // Vaga 7 é estendida
    };

    const isApartamentoEstendido = (apartmentId) => {
        return apartmentId === 103; // Apartamento 103 é estendido
    };

    beforeEach(() => {
        lotterySystem = LotterySystemFactory.createSystem({
            seed: Date.now(),
            isExtendedSpotFn: isVagaEstendida,
            isExtendedApartmentFn: isApartamentoEstendido
        });
        apartamentos = criarApartamentos();
        garagem = criarGaragem();
    });

    test('🏠 Apartamento SIMPLES deve obter vagas simples (excluindo estendidas e pré-reservadas)', () => {
        const apartamentoSimples = apartamentos.find(apt => apt.id === 101);

        // Pré-reservar um par para duplos
        garagem.preReserveDoublePairs(1);

        const options = garagem.getAvailableOptionsForApartment(apartamentoSimples, isVagaEstendida, isApartamentoEstendido);

        expect(options.type).toBe('simple');
        expect(options.spots).toHaveLength(4); // Vagas 3, 4, 5, 6 (vaga 7 é estendida, 1-2 estão pré-reservadas)
        expect(options.pairs).toHaveLength(0);

        console.log(`✅ Apartamento simples 101: ${options.spots.length} vagas simples disponíveis`);
        console.log(`   Vagas: ${options.spots.map(s => s.id).join(', ')}`);
    });

    test('🏢 Apartamento DUPLO deve obter pares duplos (incluindo pré-reservados)', () => {
        const apartamentoDuplo = apartamentos.find(apt => apt.id === 102);

        // Pré-reservar pares para duplos
        garagem.preReserveDoublePairs(2);

        const options = garagem.getAvailableOptionsForApartment(apartamentoDuplo, isVagaEstendida, isApartamentoEstendido);

        expect(options.type).toBe('double');
        expect(options.spots).toHaveLength(0);
        expect(options.pairs).toHaveLength(3); // 3 pares disponíveis: G1-A-1-2 (pré-reservado), G1-A-3-4, G1-A-5-6

        console.log(`✅ Apartamento duplo 102: ${options.pairs.length} pares duplos disponíveis`);
        console.log(`   Pares: ${options.pairs.map(p => `${p.id}(${p.aId},${p.bId})`).join(', ')}`);
    });

    test('🎯 Apartamento ESTENDIDO deve obter apenas vagas estendidas', () => {
        const apartamentoEstendido = apartamentos.find(apt => apt.id === 103);

        const options = garagem.getAvailableOptionsForApartment(apartamentoEstendido, isVagaEstendida, isApartamentoEstendido);

        expect(options.type).toBe('extended');
        expect(options.spots).toHaveLength(1); // Apenas vaga 7
        expect(options.pairs).toHaveLength(0);

        console.log(`✅ Apartamento estendido 103: ${options.spots.length} vagas estendidas disponíveis`);
        console.log(`   Vagas: ${options.spots.map(s => s.id).join(', ')}`);
    });

    test('🎲 Sistema integrado: Sorteio usando método unificado', () => {
        console.log('🎲 Testando sorteio integrado com método unificado');

        // Pré-reservar para duplos
        garagem.preReserveDoublePairs(1);

        // Sortear apartamento duplo
        const apartamentoDuplo = apartamentos.find(apt => apt.id === 102);
        const resultDuplo = lotterySystem.orchestrator.executeSorting([apartamentoDuplo], garagem);

        expect(resultDuplo.success).toBe(true);
        expect(resultDuplo.spotData.type).toBe('double');
        console.log(`✅ Apartamento duplo sorteado: ${resultDuplo.spotData.pair.id}`);

        // Atualizar garagem após sorteio
        garagem = resultDuplo.assignmentResult.garage;

        // Sortear apartamento simples
        const apartamentoSimples = apartamentos.find(apt => apt.id === 101);
        const resultSimples = lotterySystem.orchestrator.executeSorting([apartamentoSimples], garagem);

        expect(resultSimples.success).toBe(true);
        expect(resultSimples.spotData.type).toBe('simple');
        console.log(`✅ Apartamento simples sorteado: vaga ${resultSimples.spotData.spot.id}`);

        // Atualizar garagem após sorteio
        garagem = resultSimples.assignmentResult.garage;

        // Sortear apartamento estendido
        const apartamentoEstendido = apartamentos.find(apt => apt.id === 103);
        const resultEstendido = lotterySystem.orchestrator.executeSorting([apartamentoEstendido], garagem);

        expect(resultEstendido.success).toBe(true);
        expect(resultEstendido.spotData.type).toBe('extended');
        console.log(`✅ Apartamento estendido sorteado: vaga ${resultEstendido.spotData.spot.id}`);

        console.log('🎉 Todos os tipos de apartamento foram sorteados corretamente!');
    });
});