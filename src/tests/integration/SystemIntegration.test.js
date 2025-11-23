/**
 * @fileoverview Testes de Integração - Sistema Completo de Sorteio
 * @description Valida funcionamento end-to-end do sistema SOLID
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { LotterySystemFactory, Apartment, Garage, Spot } from '../../core/index.js';

describe('Sistema de Sorteio SOLID - Integração Completa', () => {
    let system;
    let apartments;
    let garage;

    beforeEach(() => {
        // Criar sistema com configuração básica
        system = LotterySystemFactory.createBasicSystem();

        // Criar apartamentos de teste
        apartments = [
            new Apartment(101, '101', true, false),   // Simples
            new Apartment(102, '102', true, true),    // Duplo
            new Apartment(303, '303', true, false),   // Estendido (configuração)
            new Apartment(201, '201', true, false),   // Simples
            new Apartment(203, '203', true, true)     // Duplo
        ];

        // Criar garage básica com vagas
        const spots = [
            new Spot(1, 'G1', 'A', 1),
            new Spot(2, 'G1', 'A', 2),
            new Spot(7, 'G1', 'A', 7),  // Estendida
            new Spot(8, 'G1', 'A', 8),  // Estendida
            new Spot(15, 'G2', 'C', 1),
            new Spot(16, 'G2', 'C', 2),
            new Spot(21, 'G3', 'E', 1), // Estendida
            new Spot(22, 'G3', 'E', 2)  // Estendida
        ];

        const pairs = {
            'G1-A-1-2': { id: 'G1-A-1-2', floor: 'G1', side: 'A', aPos: 1, bPos: 2, aId: 1, bId: 2, reservedFor: null },
            'G2-C-1-2': { id: 'G2-C-1-2', floor: 'G2', side: 'C', aPos: 1, bPos: 2, aId: 15, bId: 16, reservedFor: null }
        };

        garage = new Garage(spots, pairs);
    });

    describe('TASK 6 - Fluxo Completo de 4 Passos', () => {
        test('deve executar fluxo completo: sortear → identificar → sortear vaga → aplicar', () => {
            const result = system.executeSorting(apartments, garage);

            expect(result.success).toBe(true);
            expect(result.step).toBe(4);

            // Verificar dados de cada passo
            expect(result.apartment).toBeTruthy();
            expect(result.apartmentType).toBeTruthy();
            expect(result.spotData).toBeTruthy();
            expect(result.assignmentResult).toBeTruthy();

            // Verificar que apartamento foi marcado como sorteado
            expect(result.apartment.sorteado).toBe(true);
        });

        test('deve funcionar com apartamento simples', () => {
            const simplesApts = apartments.filter(apt => !apt.dupla && apt.id !== 303);

            const result = system.executeSorting(simplesApts, garage);

            expect(result.success).toBe(true);
            expect(result.apartmentType).toBe('simples');
            expect(result.spotData.type).toBe('simple');
            expect(result.assignmentResult.success).toBe(true);
        });

        test('deve funcionar com apartamento duplo', () => {
            const duploApts = apartments.filter(apt => apt.dupla);

            const result = system.executeSorting(duploApts, garage);

            expect(result.success).toBe(true);
            expect(result.apartmentType).toBe('duplo');
            expect(result.spotData.type).toBe('double');
            expect(result.assignmentResult.success).toBe(true);
        });

        test('deve funcionar com apartamento estendido', () => {
            const estendidoApts = apartments.filter(apt => apt.id === 303);

            const result = system.executeSorting(estendidoApts, garage);

            expect(result.success).toBe(true);
            expect(result.apartmentType).toBe('estendido');
            expect(result.spotData.type).toBe('extended');
            expect(result.assignmentResult.success).toBe(true);
        });
    });

    describe('TASK 5 - aplicarVagaAoApartamento', () => {
        test('deve aplicar vaga simples corretamente', () => {
            const apartment = apartments[0]; // Simples
            const spotData = {
                type: 'simple',
                spot: garage.spots[0] // Vaga 1
            };

            const result = system.aplicarVagaAoApartamento(apartment, spotData, garage);

            expect(result.success).toBe(true);
            expect(result.updatedApartments[0].vagas).toContain(1);
            expect(result.updatedGarage.findSpot(1).occupiedBy).toBe(101);
        });

        test('deve aplicar par duplo corretamente', () => {
            const apartment = apartments[1]; // Duplo
            const spotData = {
                type: 'double',
                pair: garage.pairs['G1-A-1-2']
            };

            const result = system.aplicarVagaAoApartamento(apartment, spotData, garage);

            expect(result.success).toBe(true);
            expect(result.updatedApartments[0].vagas).toEqual([1, 2]);
            expect(result.updatedGarage.findSpot(1).occupiedBy).toBe(102);
            expect(result.updatedGarage.findSpot(2).occupiedBy).toBe(102);
        });
    });

    describe('Validações e Tratamento de Erros', () => {
        test('deve retornar erro quando não há apartamentos disponíveis', () => {
            const emptyApartments = [];

            const result = system.executeSorting(emptyApartments, garage);

            expect(result.success).toBe(false);
            expect(result.step).toBe(1);
            expect(result.message).toContain('Nenhum apartamento disponível');
        });

        test('deve retornar erro quando não há vagas do tipo necessário', () => {
            // Ocupar todas as vagas simples
            garage.spots.forEach(spot => {
                if (![7, 8, 21, 22].includes(spot.id)) {
                    spot.occupyBy(999);
                }
            });

            const simplesApts = apartments.filter(apt => !apt.dupla && apt.id !== 303);
            const result = system.executeSorting(simplesApts, garage);

            expect(result.success).toBe(false);
            expect(result.step).toBe(3);
            expect(result.message).toContain('Nenhuma vaga disponível');
        });
    });

    describe('Estatísticas do Sistema', () => {
        test('deve retornar estatísticas corretas', () => {
            const stats = system.getStatistics(apartments, garage);

            expect(stats.apartments.total).toBe(5);
            expect(stats.apartments.available).toBe(5);
            expect(stats.spots).toHaveProperty('simples');
            expect(stats.spots).toHaveProperty('duplo');
            expect(stats.spots).toHaveProperty('estendido');
            expect(stats.garage.totalSpots).toBe(8);
        });

        test('canContinue deve detectar se pode continuar sorteio', () => {
            const canContinue = system.canContinue(apartments, garage);

            expect(canContinue.canContinue).toBe(true);
            expect(canContinue.hasApartments).toBe(true);
            expect(canContinue.hasSpots).toBe(true);
        });
    });

    describe('Execução Múltipla', () => {
        test('deve executar múltiplos sorteios sem conflitos', () => {
            const result = system.orchestrator.executeMultipleSortings(apartments, garage, 3);

            expect(result.totalDraws).toBeGreaterThan(0);
            expect(result.successfulDraws).toBeGreaterThan(0);
            expect(result.results.length).toBeGreaterThan(0);
            expect(result.finalGarage).toBeTruthy();

            // Verificar que apartamentos foram sendo marcados como sorteados
            const drawnApartments = apartments.filter(apt => apt.sorteado);
            expect(drawnApartments.length).toBe(result.successfulDraws);
        });
    });

    describe('Factory Pattern', () => {
        test('createSystem deve criar sistema completo', () => {
            const customSystem = LotterySystemFactory.createSystem({
                seed: 54321,
                isExtendedApartmentFn: (id) => id === 999,
                isExtendedSpotFn: (id) => id === 888
            });

            expect(customSystem.orchestrator).toBeTruthy();
            expect(customSystem.services).toBeTruthy();
            expect(customSystem.config.seed).toBe(54321);
            expect(typeof customSystem.executeSorting).toBe('function');
            expect(typeof customSystem.aplicarVagaAoApartamento).toBe('function');
        });

        test('createBasicSystem deve usar configuração padrão', () => {
            const basicSystem = LotterySystemFactory.createBasicSystem();

            expect(basicSystem.config.seed).toBe(12345);
            expect(basicSystem.config.isExtendedApartmentFn(303)).toBe(true);
            expect(basicSystem.config.isExtendedSpotFn(7)).toBe(true);
            expect(basicSystem.config.isExtendedApartmentFn(101)).toBe(false);
            expect(basicSystem.config.isExtendedSpotFn(1)).toBe(false);
        });
    });
});