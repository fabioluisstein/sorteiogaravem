/**
 * @fileoverview Teste do Sistema de Sorteio Simplificado
 * @description Valida se o novo sistema elimina pré-reservas e sempre seleciona vagas disponíveis do tipo correto
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { SimpleLotteryService } from '../../core/services/SimpleLotteryService.js';
import { RandomnessService } from '../../core/services/RandomnessService.js';
import { Apartment } from '../../core/models/Apartment.js';
import { Garage, Spot } from '../../core/index.js';

describe('🎲 SISTEMA SIMPLIFICADO: Sorteio Direto sem Pré-reservas', () => {
    let lotteryService;
    let randomnessService;
    let garagem;
    let apartamentos;

    const isVagaEstendida = (vagaId) => {
        return vagaId === 7; // Vaga 7 é estendida
    };

    const isApartamentoEstendido = (apartmentId) => {
        return apartmentId === 103; // Apartamento 103 é estendido
    };

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
        apts.push(new Apartment(101, '101', true, false)); // Simples
        apts.push(new Apartment(102, '102', true, true));  // Duplo
        apts.push(new Apartment(103, '103', true, false)); // Estendido
        apts.push(new Apartment(104, '104', true, false)); // Simples
        apts.push(new Apartment(105, '105', true, true));  // Duplo
        return apts;
    };

    const criarGaragem = () => {
        const spots = [];
        const pairs = {};

        const FLOORS = ['G1'];
        const SIDES_BY_FLOOR = { 'G1': ['A'] };
        const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Mais vagas para teste
        const NATURAL_PAIRS = [[1, 2], [3, 4], [5, 6]]; // Par 7,8 não existe pois 7 é estendida

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

    beforeEach(() => {
        randomnessService = new RandomnessService(12345); // Seed fixa para testes determinísticos
        lotteryService = new SimpleLotteryService(
            randomnessService,
            isVagaEstendida,
            isApartamentoEstendido
        );
        apartamentos = criarApartamentos();
        garagem = criarGaragem();
    });

    test('🎯 PREPARAÇÃO: Deve criar listas corretas de vagas disponíveis', () => {
        const availableSpots = lotteryService.prepareAvailableSpots(garagem);

        console.log('📊 Listas criadas:');
        console.log(`   🔹 Simples: ${availableSpots.simples}`);
        console.log(`   🔸 Estendidas: ${availableSpots.estendidas}`);
        console.log(`   🔹 Pares duplos: ${availableSpots.paresDuplos}`);

        // Verificar vagas simples (não estendidas, não em pares)
        expect(availableSpots.simples).toEqual([8, 9, 10, 11, 12]); // Vagas que não fazem parte de pares e não são estendidas

        // Verificar vagas estendidas
        expect(availableSpots.estendidas).toEqual([7]); // Apenas vaga 7

        // Verificar pares duplos
        expect(availableSpots.paresDuplos).toEqual(['G1-A-1-2', 'G1-A-3-4', 'G1-A-5-6']); // Pares válidos
    });

    test('🎲 SORTEIO SIMPLES: Deve atribuir vaga simples corretamente', () => {
        const apartamentoSimples = apartamentos.find(apt => apt.id === 101);
        const availableSpots = lotteryService.prepareAvailableSpots(garagem);

        const result = lotteryService.selectCompatibleSpot(apartamentoSimples, 'simples', availableSpots);

        expect(result.success).toBe(true);
        expect(result.type).toBe('simple');
        expect(result.apartmentId).toBe(101);
        expect([8, 9, 10, 11, 12]).toContain(result.spotId); // Deve ser uma das vagas simples disponíveis

        console.log(`✅ Apartamento simples 101: ${result.message}`);
    });

    test('🎲 SORTEIO DUPLO: Deve atribuir par duplo corretamente', () => {
        const apartamentoDuplo = apartamentos.find(apt => apt.id === 102);
        const availableSpots = lotteryService.prepareAvailableSpots(garagem);

        const result = lotteryService.selectCompatibleSpot(apartamentoDuplo, 'duplo', availableSpots);

        expect(result.success).toBe(true);
        expect(result.type).toBe('double');
        expect(result.apartmentId).toBe(102);
        expect(['G1-A-1-2', 'G1-A-3-4', 'G1-A-5-6']).toContain(result.pairId);

        console.log(`✅ Apartamento duplo 102: ${result.message}`);
    });

    test('🎲 SORTEIO ESTENDIDO: Deve atribuir vaga estendida corretamente', () => {
        const apartamentoEstendido = apartamentos.find(apt => apt.id === 103);
        const availableSpots = lotteryService.prepareAvailableSpots(garagem);

        const result = lotteryService.selectCompatibleSpot(apartamentoEstendido, 'estendido', availableSpots);

        expect(result.success).toBe(true);
        expect(result.type).toBe('extended');
        expect(result.apartmentId).toBe(103);
        expect(result.spotId).toBe(7); // Única vaga estendida

        console.log(`✅ Apartamento estendido 103: ${result.message}`);
    });

    test('🔄 SORTEIO COMPLETO: Deve executar sorteio sem pré-reservas', () => {
        console.log('🎲 Executando sorteio completo simplificado...');

        const result = lotteryService.executeLottery(apartamentos, garagem);

        // Verificar resultado geral
        expect(result.success).toBe(true);
        expect(result.results).toHaveLength(5); // 5 apartamentos
        expect(result.errors).toHaveLength(0);

        // Verificar que todos os tipos foram atendidos
        const tipos = result.results.map(r => r.type);
        expect(tipos).toContain('simple');
        expect(tipos).toContain('double');
        expect(tipos).toContain('extended');

        // Verificar que nenhuma vaga foi usada duas vezes
        const vagasUsadas = [];
        result.results.forEach(r => {
            if (r.type === 'simple' || r.type === 'extended') {
                expect(vagasUsadas).not.toContain(r.spotId);
                vagasUsadas.push(r.spotId);
            } else if (r.type === 'double') {
                const pair = garagem.findPair(r.pairId);
                expect(vagasUsadas).not.toContain(pair.aId);
                expect(vagasUsadas).not.toContain(pair.bId);
                vagasUsadas.push(pair.aId, pair.bId);
            }
        });

        console.log('📊 Resultado do sorteio:');
        result.results.forEach(r => {
            console.log(`   ${r.message}`);
        });

        console.log('✅ Sorteio completo executado com sucesso!');
    });

    test('🚫 VERIFICAÇÃO: Não deve haver pré-reservas no sistema', () => {
        // Verificar que o sistema não usa pré-reservas
        expect(garagem.doublePairReservations).toEqual({});

        // Executar sorteio
        const result = lotteryService.executeLottery(apartamentos, garagem);

        // Verificar que ainda não há pré-reservas após o sorteio
        expect(garagem.doublePairReservations).toEqual({});
        expect(result.success).toBe(true);

        console.log('✅ Sistema funciona sem pré-reservas!');
    });
});