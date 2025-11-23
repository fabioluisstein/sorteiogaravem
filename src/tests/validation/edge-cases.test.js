/**
 * @fileoverview Testes Específicos de Validação - Casos Extremos e Cenários Críticos
 * @description Complementa o teste principal com validações detalhadas de edge cases
 */

import { describe, test, beforeEach, expect } from '@jest/globals';
import { Garage } from '../../../src/core/models/Garage.js';
import { Spot } from '../../../src/core/models/Spot.js';
import { Apartment } from '../../../src/core/models/Apartment.js';

describe('🔍 Validações Específicas - Casos Extremos', () => {
    let garagem;

    const VAGAS_ESTENDIDAS = [7, 8, 21, 22, 35, 36];
    const APARTAMENTOS_DUPLOS = [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702];
    const APARTAMENTOS_ESTENDIDOS = [303, 403, 503, 603, 703];

    // Pares que NÃO devem existir (fisicamente impossíveis ou com vagas estendidas)
    const PARES_PROIBIDOS = [
        [7, 8],   // Ambas estendidas
        [21, 22], // Ambas estendidas  
        [35, 36], // Ambas estendidas
        [22, 23], // Uma estendida + adjacente impossível
        [36, 37], // Uma estendida + adjacente impossível
        [6, 7],   // Transição entre lados
        [13, 14], // Transição entre lados
        [20, 21], // Transição entre lados
        [27, 28], // Transição entre andares
        [34, 35], // Transição entre lados
        [41, 42]  // Transição final
    ];

    beforeEach(() => {
        garagem = criarGaragemTeste();
    });

    function criarGaragemTeste() {
        const spots = [];
        const pairs = {};

        // Criar todas as 42 vagas
        for (let i = 1; i <= 42; i++) {
            spots.push(new Spot(i, `G${Math.ceil(i / 14)}`, 'TEST', i, 'VAGA'));
        }

        // Adicionar apenas pares válidos (sem estendidas e fisicamente possíveis)
        const paresValidos = [
            [1, 2], [3, 4], [5, 6],
            [8, 9], [10, 11], [12, 13],
            [15, 16], [17, 18], [19, 20],
            [29, 30], [31, 32], [33, 34],
            [38, 39]
        ];

        for (let i = 0; i < paresValidos.length; i++) {
            const [aId, bId] = paresValidos[i];
            pairs[`PAR_${i + 1}`] = {
                id: `PAR_${i + 1}`,
                aId,
                bId,
                reservedFor: null
            };
        }

        return new Garage(spots, pairs);
    }

    // ==================== TESTES DE ESTRUTURA ====================

    test('🏗️ Garagem deve ter exatamente 42 vagas', () => {
        expect(garagem.spots.length).toBe(42);

        // Verificar IDs sequenciais
        const vagaIds = garagem.spots.map(spot => spot.id).sort((a, b) => a - b);
        expect(vagaIds).toEqual(Array.from({ length: 42 }, (_, i) => i + 1));
    });

    test('🏗️ Deve ter exatamente 13 pares válidos', () => {
        expect(Object.keys(garagem.pairs).length).toBe(13);

        // Verificar que são os pares corretos
        const paresEsperados = [
            [1, 2], [3, 4], [5, 6],
            [8, 9], [10, 11], [12, 13],
            [15, 16], [17, 18], [19, 20],
            [29, 30], [31, 32], [33, 34],
            [38, 39]
        ];

        const paresReais = Object.values(garagem.pairs).map(pair => [pair.aId, pair.bId]);

        for (const parEsperado of paresEsperados) {
            const existe = paresReais.some(parReal =>
                (parReal[0] === parEsperado[0] && parReal[1] === parEsperado[1]) ||
                (parReal[0] === parEsperado[1] && parReal[1] === parEsperado[0])
            );
            expect(existe).toBe(true, `Par ${parEsperado.join('-')} não encontrado`);
        }
    });

    test('🚫 Pares proibidos NÃO devem existir na garagem', () => {
        const paresReais = Object.values(garagem.pairs).map(pair => [pair.aId, pair.bId]);

        for (const parProibido of PARES_PROIBIDOS) {
            const existe = paresReais.some(parReal =>
                (parReal[0] === parProibido[0] && parReal[1] === parProibido[1]) ||
                (parReal[0] === parProibido[1] && parReal[1] === parProibido[0])
            );
            expect(existe).toBe(false, `Par proibido ${parProibido.join('-')} foi encontrado na garagem!`);
        }
    });

    // ==================== TESTES DE VAGAS ESTENDIDAS ====================

    test('🔸 Vagas estendidas devem estar corretas', () => {
        expect(VAGAS_ESTENDIDAS.length).toBe(6);
        expect(VAGAS_ESTENDIDAS).toEqual([7, 8, 21, 22, 35, 36]);

        // Verificar que todas existem na garagem
        for (const vagaId of VAGAS_ESTENDIDAS) {
            const vagaExiste = garagem.spots.some(spot => spot.id === vagaId);
            expect(vagaExiste).toBe(true, `Vaga estendida ${vagaId} não encontrada na garagem`);
        }
    });

    test('🔸 Nenhuma vaga estendida pode fazer parte de par duplo', () => {
        const paresReais = Object.values(garagem.pairs);

        for (const pair of paresReais) {
            expect(VAGAS_ESTENDIDAS.includes(pair.aId)).toBe(false,
                `Vaga estendida ${pair.aId} faz parte do par duplo ${pair.id}`);
            expect(VAGAS_ESTENDIDAS.includes(pair.bId)).toBe(false,
                `Vaga estendida ${pair.bId} faz parte do par duplo ${pair.id}`);
        }
    });

    // ==================== TESTES DE APARTAMENTOS ====================

    test('📋 Configuração de apartamentos deve estar correta', () => {
        expect(APARTAMENTOS_DUPLOS.length).toBe(14);
        expect(APARTAMENTOS_ESTENDIDOS.length).toBe(5);

        // Verificar que não há sobreposição
        const sobreposicao = APARTAMENTOS_DUPLOS.filter(apt => APARTAMENTOS_ESTENDIDOS.includes(apt));
        expect(sobreposicao.length).toBe(0, `Apartamentos não podem ser duplos E estendidos: ${sobreposicao.join(', ')}`);
    });

    test('📋 Total de apartamentos deve ser 28 (7 andares × 4 unidades)', () => {
        const totalEsperado = 7 * 4; // 7 andares, 4 apartamentos por andar
        const totalDuplos = APARTAMENTOS_DUPLOS.length;
        const totalEstendidos = APARTAMENTOS_ESTENDIDOS.length;
        const totalSimples = totalEsperado - totalDuplos - totalEstendidos;

        expect(totalDuplos + totalEstendidos + totalSimples).toBe(28);
        expect(totalSimples).toBe(9); // 28 - 14 - 5 = 9 apartamentos simples
    });

    // ==================== TESTES MATEMÁTICOS ====================

    test('🧮 Matemática das vagas deve fechar', () => {
        const totalVagas = 42;
        const vagasEmPares = 13 * 2; // 13 pares × 2 vagas = 26 vagas
        const vagasEstendidas = 6;
        const vagasSimples = totalVagas - vagasEmPares - vagasEstendidas; // 42 - 26 - 6 = 10

        expect(vagasEmPares).toBe(26);
        expect(vagasEstendidas).toBe(6);
        expect(vagasSimples).toBe(10);
        expect(vagasEmPares + vagasEstendidas + vagasSimples).toBe(42);
    });

    test('🧮 Matemática dos apartamentos vs vagas deve ser consistente', () => {
        const apartamentosDuplos = 14; // Cada um precisa de 2 vagas
        const apartamentosEstendidos = 5; // Cada um precisa de 1 vaga estendida
        const apartamentosSimples = 9; // Cada um precisa de 1 vaga simples

        const vagasNecessariasDuplos = apartamentosDuplos * 2; // 28 vagas
        const vagasNecessariasEstendidos = apartamentosEstendidos * 1; // 5 vagas
        const vagasNecessariasSimples = apartamentosSimples * 1; // 9 vagas

        // Mas temos apenas 26 vagas em pares duplos!
        // Isso significa que alguns apartamentos duplos NÃO conseguirão pares
        expect(vagasNecessariasDuplos).toBe(28);
        expect(vagasNecessariasEstendidos).toBe(5);
        expect(vagasNecessariasSimples).toBe(9);

        // Total de vagas necessárias seria 42, mas distribuição é diferente
        const totalNecessario = vagasNecessariasDuplos + vagasNecessariasEstendidos + vagasNecessariasSimples;
        expect(totalNecessario).toBe(42);

        // PROBLEMA: Temos apenas 13 pares (26 vagas) para 14 apartamentos duplos!
        console.warn('⚠️ ATENÇÃO: Temos 14 apartamentos duplos mas apenas 13 pares disponíveis!');
        console.warn('⚠️ Um apartamento duplo terá que receber vaga simples!');
    });

    // ==================== TESTE DE CENÁRIO CRÍTICO ====================

    test('⚠️ Cenário crítico: Mais apartamentos duplos que pares disponíveis', () => {
        const paresDisponiveis = Object.keys(garagem.pairs).length; // 13
        const apartamentosDuplos = APARTAMENTOS_DUPLOS.length; // 14

        expect(apartamentosDuplos).toBeGreaterThan(paresDisponiveis);
        expect(apartamentosDuplos - paresDisponiveis).toBe(1);

        console.log(`📊 Pares disponíveis: ${paresDisponiveis}`);
        console.log(`📊 Apartamentos duplos: ${apartamentosDuplos}`);
        console.log(`⚠️ Déficit: ${apartamentosDuplos - paresDisponiveis} apartamento duplo sem par`);

        // Este teste documenta que o sistema deve lidar com essa situação
        // O apartamento duplo que não conseguir par deve receber vaga simples
    });

    // ==================== TESTES DE VALIDAÇÃO DE DADOS ====================

    test('🔍 Apartamentos duplos estão em ordem e são válidos', () => {
        for (const aptId of APARTAMENTOS_DUPLOS) {
            expect(aptId).toBeGreaterThanOrEqual(101);
            expect(aptId).toBeLessThanOrEqual(704);

            // Verificar formato correto (andar + unidade)
            const andar = Math.floor(aptId / 100);
            const unidade = aptId % 100;

            expect(andar).toBeGreaterThanOrEqual(1);
            expect(andar).toBeLessThanOrEqual(7);
            expect(unidade).toBeGreaterThanOrEqual(1);
            expect(unidade).toBeLessThanOrEqual(4);
        }
    });

    test('🔍 Apartamentos estendidos estão em ordem e são válidos', () => {
        for (const aptId of APARTAMENTOS_ESTENDIDOS) {
            expect(aptId).toBeGreaterThanOrEqual(101);
            expect(aptId).toBeLessThanOrEqual(704);

            // Verificar formato correto (andar + unidade)
            const andar = Math.floor(aptId / 100);
            const unidade = aptId % 100;

            expect(andar).toBeGreaterThanOrEqual(1);
            expect(andar).toBeLessThanOrEqual(7);
            expect(unidade).toBeGreaterThanOrEqual(1);
            expect(unidade).toBeLessThanOrEqual(4);
        }
    });

    test('🔍 Todas as vagas estão no intervalo correto', () => {
        for (const spot of garagem.spots) {
            expect(spot.id).toBeGreaterThanOrEqual(1);
            expect(spot.id).toBeLessThanOrEqual(42);
        }
    });

    test('🔍 Todos os pares têm vagas válidas e adjacentes logicamente', () => {
        for (const pair of Object.values(garagem.pairs)) {
            // Verificar que ambas as vagas existem
            expect(pair.aId).toBeGreaterThanOrEqual(1);
            expect(pair.aId).toBeLessThanOrEqual(42);
            expect(pair.bId).toBeGreaterThanOrEqual(1);
            expect(pair.bId).toBeLessThanOrEqual(42);

            // Verificar que são diferentes
            expect(pair.aId).not.toBe(pair.bId);

            // Verificar que são adjacentes (diferença de 1)
            const diff = Math.abs(pair.bId - pair.aId);
            expect(diff).toBe(1, `Par ${pair.id} tem vagas não-adjacentes: ${pair.aId}-${pair.bId}`);
        }
    });
});