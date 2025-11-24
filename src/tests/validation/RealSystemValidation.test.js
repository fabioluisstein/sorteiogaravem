/**
 * @fileoverview Teste de validação do sistema real
 * @description Valida se apartamentos estendidos (403, 503, 603, 703) são detectados corretamente
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { LotterySystemFactory } from '../../core/index.js';
import { Apartment } from '../../core/models/Apartment.js';
import { Garage, Spot } from '../../core/index.js';

describe('🔍 VALIDAÇÃO: Sistema Real - Apartamentos Estendidos', () => {
    let lotterySystem;

    const apartamentosEstendidos = [403, 503, 603, 703];

    const isVagaEstendida = (vagaId) => {
        return [7, 8, 21, 22, 35, 36].includes(vagaId); // Vagas estendidas padrão
    };

    const isApartamentoEstendido = (apartmentId) => {
        return apartamentosEstendidos.includes(apartmentId);
    };

    beforeEach(() => {
        lotterySystem = LotterySystemFactory.createSystem({
            seed: Date.now(),
            isExtendedSpotFn: isVagaEstendida,
            isExtendedApartmentFn: isApartamentoEstendido
        });
    });

    test('🎯 APARTAMENTOS ESTENDIDOS: Devem ser detectados corretamente', () => {
        const apartamentosTest = [
            { id: 303, dupla: false }, // Estendido
            { id: 403, dupla: false }, // Estendido
            { id: 503, dupla: false }, // Estendido
            { id: 603, dupla: false }, // Estendido
            { id: 703, dupla: false }, // Estendido
            { id: 301, dupla: false }, // Simples
            { id: 302, dupla: true },  // Duplo
        ];

        const solidApartments = apartamentosTest.map(apt => Apartment.fromJSON({
            id: apt.id,
            apartmentNumber: apt.id.toString(),
            ativo: true,
            dupla: apt.dupla,
            estendido: isApartamentoEstendido(apt.id),
            sorteado: false,
            vagas: []
        }));

        // Verificar se apartamentos estendidos são detectados pelo typeDetector
        const typeDetector = lotterySystem.services.typeDetector;

        // Apartamentos estendidos
        for (const id of apartamentosEstendidos) {
            const apt = solidApartments.find(a => a.id === id);
            const detectedType = typeDetector.determineType(apt);

            console.log(`🔍 Apartamento ${id}: Tipo detectado = ${detectedType}`);
            expect(detectedType).toBe('estendido');
        }

        // Apartamento simples
        const aptSimples = solidApartments.find(a => a.id === 301);
        expect(typeDetector.determineType(aptSimples)).toBe('simples');

        // Apartamento duplo
        const aptDuplo = solidApartments.find(a => a.id === 302);
        expect(typeDetector.determineType(aptDuplo)).toBe('duplo');

        console.log('✅ Todos os apartamentos foram detectados corretamente!');
    });

    test('🔧 FUNÇÃO isExtendedApartmentFn: Deve funcionar corretamente', () => {
        const config = lotterySystem.config;

        // Testar função diretamente
        for (const id of apartamentosEstendidos) {
            const isExtended = config.isExtendedApartmentFn(id);
            console.log(`🎯 Apartamento ${id}: isExtended = ${isExtended}`);
            expect(isExtended).toBe(true);
        }

        // Testar apartamentos não estendidos
        const apartamentosNaoEstendidos = [101, 201, 301, 401, 501, 601, 701];
        for (const id of apartamentosNaoEstendidos) {
            const isExtended = config.isExtendedApartmentFn(id);
            expect(isExtended).toBe(false);
        }

        console.log('✅ Função isExtendedApartmentFn funcionando corretamente!');
    });
});