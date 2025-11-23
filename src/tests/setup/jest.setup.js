/**
 * @fileoverview Configuração global do Jest para testes do sistema de sorteio
 * @description Mocks e configurações compartilhadas entre todos os testes
 */

import { jest } from '@jest/globals';

// ==================== CONFIGURAÇÕES GLOBAIS ====================

// Timeout para testes longos (sorteios completos)
jest.setTimeout(30000);

// ==================== MOCKS GLOBAIS ====================

// Mock para configuração de sorteio
global.mockSorteioConfig = {
    vagas_estendidas: '7,8,21,22,35,36',
    apartamentos_duplos: '101,102,103,104,203,301,304,402,404,501,502,604,701,702',
    apartamentos_estendidos: '303,403,503,603,703',
    vagas_proibidas_duplo: '7,8,21,22,35,36',
    total_vagas: 42,
    seed_sorteio: 12345
};

// Mock para console em testes silenciosos
const originalConsole = global.console;

global.setupSilentMode = () => {
    global.console = {
        ...originalConsole,
        log: jest.fn(),
        info: jest.fn(),
        warn: originalConsole.warn,
        error: originalConsole.error
    };
};

global.restoreConsole = () => {
    global.console = originalConsole;
};

// ==================== UTILITÁRIOS DE TESTE ====================

/**
 * Gera seed determinística para testes reproduzíveis
 */
global.getTestSeed = (testName) => {
    let hash = 0;
    for (let i = 0; i < testName.length; i++) {
        const char = testName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

/**
 * Matchers customizados para validações específicas do sorteio
 */
expect.extend({
    /**
     * Valida se um par de vagas é fisicamente válido
     */
    toBeValidPair(received, expectedPairs) {
        const [vagaA, vagaB] = received;
        const isValid = expectedPairs.some(pair =>
            (pair.ids[0] === vagaA && pair.ids[1] === vagaB) ||
            (pair.ids[0] === vagaB && pair.ids[1] === vagaA)
        );

        return {
            message: () => `Expected [${vagaA}, ${vagaB}] to be a valid pair`,
            pass: isValid
        };
    },

    /**
     * Valida se vaga é estendida
     */
    toBeExtendedSpot(received, extendedSpots = [7, 8, 21, 22, 35, 36]) {
        const isExtended = extendedSpots.includes(parseInt(received));

        return {
            message: () => `Expected spot ${received} to be extended`,
            pass: isExtended
        };
    },

    /**
     * Valida se apartamento recebeu tipo correto de vaga
     */
    toHaveCorrectSpotType(received, expectedType) {
        const { apartment, spots } = received;
        let actualType;

        if (spots.length === 2) {
            actualType = 'double';
        } else if (spots.length === 1) {
            const vagaId = spots[0];
            const isExtended = [7, 8, 21, 22, 35, 36].includes(vagaId);
            actualType = isExtended ? 'extended' : 'simple';
        } else {
            actualType = 'invalid';
        }

        return {
            message: () => `Expected apartment ${apartment} to receive ${expectedType} spot(s), got ${actualType}`,
            pass: actualType === expectedType
        };
    }
});

// ==================== HOOKS GLOBAIS ====================

// Configuração executada antes de cada teste
beforeEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();

    // Restaurar console se estiver mockado
    if (global.console !== originalConsole) {
        global.restoreConsole();
    }
});

// Limpeza após cada teste
afterEach(() => {
    // Restaurar console
    global.restoreConsole();
});

console.log('🔧 Jest configurado para testes do sistema de sorteio Flor de Lis');