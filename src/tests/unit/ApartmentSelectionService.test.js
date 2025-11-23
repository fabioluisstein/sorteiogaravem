/**
 * @fileoverview Testes para TASK 1 - ApartmentSelectionService
 * @description Testa seleção aleatória de apartamentos seguindo todos os critérios
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ApartmentSelectionService, RandomnessService, Apartment } from '../../core/index.js';

describe('TASK 1 - ApartmentSelectionService', () => {
    let service;
    let mockRandomness;
    let apartments;

    beforeEach(() => {
        // Criar serviço de aleatorização com seed fixo para testes previsíveis
        mockRandomness = new RandomnessService(12345);
        service = new ApartmentSelectionService(mockRandomness);

        // Criar apartamentos de teste
        apartments = [
            new Apartment(101, '101', true, false),   // Ativo, simples
            new Apartment(102, '102', true, true),    // Ativo, duplo
            new Apartment(103, '103', false, false),  // Inativo
            new Apartment(201, '201', true, false)    // Ativo, simples
        ];
    });

    describe('CRITÉRIO 1: Nunca deve retornar apartamento já sorteado', () => {
        test('deve ignorar apartamentos já sorteados', () => {
            // Marcar apartamento como sorteado
            apartments[0].markAsDrawn();
            apartments[1].markAsDrawn();

            const selected = service.selectRandomApartment(apartments);

            // Deve retornar apenas apartamentos não sorteados e ativos
            expect(selected).toBeTruthy();
            expect(selected.sorteado).toBe(false);
            expect(selected.ativo).toBe(true);
            expect(selected.id).toBe(201); // Único ativo e não sorteado (103 está inativo)
        });

        test('deve retornar null quando todos apartamentos estão sorteados', () => {
            // Marcar todos como sorteados
            apartments.forEach(apt => apt.markAsDrawn());

            const selected = service.selectRandomApartment(apartments);

            expect(selected).toBeNull();
        });
    });

    describe('CRITÉRIO 2: Nunca deve retornar apartamento inativo', () => {
        test('deve ignorar apartamentos inativos', () => {
            // Marcar alguns como inativos
            apartments[2].ativo = false;

            const selected = service.selectRandomApartment(apartments);

            expect(selected).toBeTruthy();
            expect(selected.ativo).toBe(true);
            expect(selected.id).not.toBe(103); // 103 está inativo
        });

        test('deve retornar null quando todos apartamentos estão inativos', () => {
            apartments.forEach(apt => apt.ativo = false);

            const selected = service.selectRandomApartment(apartments);

            expect(selected).toBeNull();
        });
    });

    describe('CRITÉRIO 3: Deve retornar exatamente 1 apartamento', () => {
        test('deve retornar um único apartamento', () => {
            const selected = service.selectRandomApartment(apartments);

            expect(selected).toBeTruthy();
            expect(typeof selected).toBe('object');
            expect(selected.constructor.name).toBe('Apartment');
        });

        test('não deve retornar array ou múltiplos apartamentos', () => {
            const selected = service.selectRandomApartment(apartments);

            expect(Array.isArray(selected)).toBe(false);
            expect(selected).toHaveProperty('id');
            expect(typeof selected.id).toBe('number');
        });
    });

    describe('CRITÉRIO 4: RandomService.shuffle deve ser chamado', () => {
        test('deve usar randomização para ordem dos apartamentos', () => {
            const shuffleSpy = vi.spyOn(mockRandomness, 'shuffle');

            service.selectRandomApartment(apartments);

            expect(shuffleSpy).toHaveBeenCalled();
            expect(shuffleSpy).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ id: 101 }),
                    expect.objectContaining({ id: 102 }),
                    expect.objectContaining({ id: 201 })
                ])
            );
        });

        test('deve produzir resultados diferentes com seeds diferentes', () => {
            const service1 = new ApartmentSelectionService(new RandomnessService(111));
            const service2 = new ApartmentSelectionService(new RandomnessService(222));

            // Criar múltiplos apartamentos para aumentar chance de diferença
            const manyApartments = Array.from({ length: 10 }, (_, i) =>
                new Apartment(100 + i, `${100 + i}`, true, false)
            );

            const results1 = [];
            const results2 = [];

            // Executar múltiplas seleções
            for (let i = 0; i < 5; i++) {
                const apt1 = service1.selectRandomApartment([...manyApartments]);
                const apt2 = service2.selectRandomApartment([...manyApartments]);

                if (apt1) results1.push(apt1.id);
                if (apt2) results2.push(apt2.id);

                // Marcar como sorteados para próxima iteração
                if (apt1) apt1.markAsDrawn();
                if (apt2) apt2.markAsDrawn();
            }

            // Com seeds diferentes, as sequências devem ser diferentes
            expect(results1).not.toEqual(results2);
        });
    });

    describe('CRITÉRIO 5: Deve retornar null quando não há apartamentos', () => {
        test('deve retornar null para array vazio', () => {
            const selected = service.selectRandomApartment([]);

            expect(selected).toBeNull();
        });

        test('deve retornar null para entrada null', () => {
            const selected = service.selectRandomApartment(null);

            expect(selected).toBeNull();
        });

        test('deve retornar null para entrada undefined', () => {
            const selected = service.selectRandomApartment(undefined);

            expect(selected).toBeNull();
        });

        test('deve retornar null quando não há apartamentos válidos', () => {
            // Todos inativos e sorteados
            apartments.forEach(apt => {
                apt.ativo = false;
                apt.markAsDrawn();
            });

            const selected = service.selectRandomApartment(apartments);

            expect(selected).toBeNull();
        });
    });

    describe('Métodos auxiliares', () => {
        test('markAsDrawn deve marcar apartamento como sorteado', () => {
            const apartment = apartments[0];
            expect(apartment.sorteado).toBe(false);

            const result = service.markAsDrawn(apartment);

            expect(result).toBe(true);
            expect(apartment.sorteado).toBe(true);
        });

        test('getStatistics deve retornar estatísticas corretas', () => {
            apartments[0].markAsDrawn();
            apartments[2].ativo = false;

            const stats = service.getStatistics(apartments);

            expect(stats.total).toBe(4);
            expect(stats.available).toBe(2); // 102 e 201
            expect(stats.drawn).toBe(1);     // 101
            expect(stats.inactive).toBe(1);  // 103
        });

        test('hasAvailableApartments deve detectar apartamentos disponíveis', () => {
            expect(service.hasAvailableApartments(apartments)).toBe(true);

            // Marcar todos como sorteados ou inativos
            apartments.forEach(apt => apt.markAsDrawn());
            expect(service.hasAvailableApartments(apartments)).toBe(false);
        });
    });

    describe('Casos extremos', () => {
        test('deve funcionar com um único apartamento disponível', () => {
            const singleApartment = [new Apartment(101, '101', true, false)];

            const selected = service.selectRandomApartment(singleApartment);

            expect(selected).toBeTruthy();
            expect(selected.id).toBe(101);
        });

        test('deve lidar com apartamentos com IDs não sequenciais', () => {
            const weirdApartments = [
                new Apartment(999, '999', true, false),
                new Apartment(1, '001', true, false),
                new Apartment(500, '500', true, false)
            ];

            const selected = service.selectRandomApartment(weirdApartments);

            expect(selected).toBeTruthy();
            expect([999, 1, 500].includes(selected.id)).toBe(true);
        });
    });
});