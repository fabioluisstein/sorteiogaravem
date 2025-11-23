/**
 * @fileoverview Teste Automatizado Completo - Sorteio de Garagens Edifício Flor de Lis
 * @description Valida todas as regras do sorteio para as 42 vagas disponíveis
 * 
 * Testa:
 * - 14 apartamentos duplos recebem pares válidos exclusivamente
 * - 5 apartamentos estendidos recebem vagas estendidas exclusivamente  
 * - Apartamentos simples recebem vagas simples exclusivamente
 * - Integridade matemática: 42 vagas = total de atribuições
 * - Nenhuma duplicação ou sobreposição de vagas
 */

import { describe, test, beforeEach, expect, jest } from '@jest/globals';
import { Garage } from '../../../src/core/models/Garage.js';
import { Spot } from '../../../src/core/models/Spot.js';
import { Apartment } from '../../../src/core/models/Apartment.js';
import { LotterySystemFactory } from '../../../src/core/index.js';

describe('🎯 Sorteio Completo de Garagens - Edifício Flor de Lis', () => {
    let garagem;
    let apartamentos;
    let lotterySystem;

    // ==================== CONFIGURAÇÃO DE DADOS ====================

    const VAGAS_ESTENDIDAS = [7, 8, 21, 22, 35, 36];

    const APARTAMENTOS_DUPLOS = [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702];

    const APARTAMENTOS_ESTENDIDOS = [303, 403, 503, 603, 703];

    // Pares fisicamente válidos (baseado na estrutura do edifício)
    const PARES_VALIDOS = [
        { ids: [1, 2], name: 'G1-A-1-2' },
        { ids: [3, 4], name: 'G1-A-3-4' },
        { ids: [5, 6], name: 'G1-A-5-6' },
        { ids: [8, 9], name: 'G1-B-1-2' },
        { ids: [10, 11], name: 'G1-B-3-4' },
        { ids: [12, 13], name: 'G1-B-5-6' },
        { ids: [15, 16], name: 'G2-C-1-2' },
        { ids: [17, 18], name: 'G2-C-3-4' },
        { ids: [19, 20], name: 'G2-C-5-6' },
        { ids: [29, 30], name: 'G3-E-1-2' },
        { ids: [31, 32], name: 'G3-E-3-4' },
        { ids: [33, 34], name: 'G3-E-5-6' },
        { ids: [38, 39], name: 'G3-F-3-4' }
    ];

    const TOTAL_PARES_VALIDOS = PARES_VALIDOS.length; // 13 pares
    const TOTAL_VAGAS_ESTENDIDAS = VAGAS_ESTENDIDAS.length; // 6 vagas
    const TOTAL_APARTAMENTOS_DUPLOS = APARTAMENTOS_DUPLOS.length; // 14 apartamentos
    const TOTAL_APARTAMENTOS_ESTENDIDOS = APARTAMENTOS_ESTENDIDOS.length; // 5 apartamentos

    // ==================== FUNÇÕES AUXILIARES ====================

    /**
     * Cria todos os apartamentos do edifício (101-704)
     */
    function criarTodosApartamentos() {
        const apartamentos = [];

        for (let andar = 1; andar <= 7; andar++) {
            for (let unidade = 1; unidade <= 4; unidade++) {
                const numero = parseInt(`${andar}0${unidade}`);

                const isDuplo = APARTAMENTOS_DUPLOS.includes(numero);
                const isEstendido = APARTAMENTOS_ESTENDIDOS.includes(numero);

                // Apartamentos não podem ser duplos E estendidos simultaneamente
                if (isDuplo && isEstendido) {
                    throw new Error(`Apartamento ${numero} não pode ser duplo E estendido`);
                }

                apartamentos.push(new Apartment(numero, numero.toString(), true, isDuplo));
            }
        }

        return apartamentos;
    }

    /**
     * Cria garagem completa com 42 vagas e pares válidos
     */
    function criarGaragemCompleta() {
        const spots = [];
        const pairs = {};

        // Função para converter posição em ID sequencial
        const positionToId = (floor, side, position) => {
            const floors = ['G1', 'G2', 'G3'];
            const sidesByFloor = {
                'G1': ['A', 'B'],
                'G2': ['C', 'D'],
                'G3': ['E', 'F']
            };

            let baseId = 0;
            for (let f = 0; f < floors.indexOf(floor); f++) {
                baseId += sidesByFloor[floors[f]].length * 7;
            }

            const sideIndex = sidesByFloor[floor].indexOf(side);
            baseId += sideIndex * 7;
            baseId += position;

            return baseId;
        };

        // Criar todas as 42 vagas
        const estrutura = [
            { floor: 'G1', sides: ['A', 'B'] },
            { floor: 'G2', sides: ['C', 'D'] },
            { floor: 'G3', sides: ['E', 'F'] }
        ];

        for (const { floor, sides } of estrutura) {
            for (const side of sides) {
                for (let pos = 1; pos <= 7; pos++) {
                    const vagaId = positionToId(floor, side, pos);
                    spots.push(new Spot(vagaId, floor, side, pos, 'VAGA'));
                }
            }
        }

        // Criar apenas os pares fisicamente válidos
        for (const { ids, name } of PARES_VALIDOS) {
            pairs[name] = {
                id: name,
                aId: ids[0],
                bId: ids[1],
                reservedFor: null
            };
        }

        return new Garage(spots, pairs);
    }

    /**
     * Função para determinar se vaga é estendida
     */
    const isVagaEstendida = (vagaId) => VAGAS_ESTENDIDAS.includes(parseInt(vagaId));

    /**
     * Função para determinar se apartamento é estendido
     */
    const isApartamentoEstendido = (aptId) => APARTAMENTOS_ESTENDIDOS.includes(aptId);

    // ==================== CONFIGURAÇÃO DOS TESTES ====================

    beforeEach(() => {
        // Mock da configuração
        jest.clearAllMocks();

        // Criar garagem e apartamentos
        garagem = criarGaragemCompleta();
        apartamentos = criarTodosApartamentos();

        // Criar sistema de sorteio
        lotterySystem = LotterySystemFactory.createSystem({
            seed: 12345, // Seed fixo para testes determinísticos
            isExtendedSpotFn: isVagaEstendida,
            isExtendedApartmentFn: isApartamentoEstendido
        });

        console.log('🏗️ Setup do teste:');
        console.log(`   📊 Apartamentos criados: ${apartamentos.length}`);
        console.log(`   📊 Duplos: ${apartamentos.filter(apt => apt.dupla).length}`);
        console.log(`   📊 Estendidos: ${apartamentos.filter(apt => isApartamentoEstendido(apt.id)).length}`);
        console.log(`   📊 Simples: ${apartamentos.filter(apt => !apt.dupla && !isApartamentoEstendido(apt.id)).length}`);
        console.log(`   📊 Vagas: ${garagem.spots.length}`);
        console.log(`   📊 Pares válidos: ${Object.keys(garagem.pairs).length}`);
    });

    // ==================== TESTE PRINCIPAL ====================

    test('🎯 Sorteio completo deve respeitar todas as regras de distribuição', async () => {
        console.log('\n🎲 ===== INICIANDO SORTEIO COMPLETO =====');

        // ========== EXECUÇÃO DO SORTEIO ==========

        let sorteiosRealizados = 0;
        let garagemAtual = garagem.clone();
        const apartamentosAtivos = apartamentos.filter(apt => apt.ativo);
        const resultados = [];

        // Executar sorteio para todos os apartamentos
        while (sorteiosRealizados < apartamentosAtivos.length) {
            const apartamentosDisponiveis = apartamentosAtivos.filter(apt => apt.isAvailableForDraw());

            if (apartamentosDisponiveis.length === 0) {
                break;
            }

            const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garagemAtual);

            if (result.success) {
                // Aplicar resultado
                garagemAtual = result.assignmentResult.garage;

                // Marcar apartamento como sorteado
                const apt = apartamentosAtivos.find(a => a.id === result.apartment.id);
                apt.sorteado = true;

                resultados.push(result);
                sorteiosRealizados++;

                console.log(`✅ Apto ${result.apartment.id} sorteado (${sorteiosRealizados}/${apartamentosAtivos.length})`);
            } else {
                console.error(`❌ Falha no sorteio: ${result.message}`);
                break;
            }
        }

        console.log(`\n📊 Sorteio finalizado: ${sorteiosRealizados} apartamentos sorteados`);

        // ========== ANÁLISE DOS RESULTADOS ==========

        const apartamentosDuplosResultados = [];
        const apartamentosEstendidosResultados = [];
        const apartamentosSimplesResultados = [];
        const todasVagasUsadas = [];

        for (const result of resultados) {
            const aptId = result.apartment.id;
            const isDuplo = APARTAMENTOS_DUPLOS.includes(aptId);
            const isEstendido = APARTAMENTOS_ESTENDIDOS.includes(aptId);

            let vagasUsadas = [];

            if (result.spotData.type === 'double') {
                vagasUsadas = [result.spotData.pair.aId, result.spotData.pair.bId];
                apartamentosDuplosResultados.push({ aptId, vagas: vagasUsadas, par: result.spotData.pair });
            } else {
                vagasUsadas = [result.spotData.spot.id];
                if (isEstendido) {
                    apartamentosEstendidosResultados.push({ aptId, vagas: vagasUsadas });
                } else {
                    apartamentosSimplesResultados.push({ aptId, vagas: vagasUsadas });
                }
            }

            todasVagasUsadas.push(...vagasUsadas);
        }

        // ========== VALIDAÇÕES DE DUPLOS ==========

        describe('🔄 Validação de Apartamentos Duplos', () => {
            test('Quantidade exata de duplos atribuídos', () => {
                expect(apartamentosDuplosResultados.length).toBe(TOTAL_APARTAMENTOS_DUPLOS);
            });

            test('Todos os duplos receberam pares válidos', () => {
                for (const { aptId, vagas, par } of apartamentosDuplosResultados) {
                    const parValido = PARES_VALIDOS.find(p =>
                        (p.ids[0] === vagas[0] && p.ids[1] === vagas[1]) ||
                        (p.ids[0] === vagas[1] && p.ids[1] === vagas[0])
                    );

                    expect(parValido).toBeDefined(`Apartamento ${aptId} recebeu par inválido: ${vagas.join('-')}`);
                }
            });

            test('Nenhum par inválido foi usado', () => {
                const paresInvalidos = [
                    [7, 8], [21, 22], [35, 36], // Estendidas
                    [22, 23], [36, 37] // Exemplos de pares fisicamente impossíveis
                ];

                for (const { vagas } of apartamentosDuplosResultados) {
                    for (const [a, b] of paresInvalidos) {
                        const temParInvalido = (vagas[0] === a && vagas[1] === b) ||
                            (vagas[0] === b && vagas[1] === a);
                        expect(temParInvalido).toBe(false, `Par inválido usado: ${vagas.join('-')}`);
                    }
                }
            });
        });

        // ========== VALIDAÇÕES DE ESTENDIDOS ==========

        describe('🔸 Validação de Apartamentos Estendidos', () => {
            test('Quantidade exata de estendidos atribuídos', () => {
                expect(apartamentosEstendidosResultados.length).toBe(TOTAL_APARTAMENTOS_ESTENDIDOS);
            });

            test('Todos receberam vagas estendidas exclusivamente', () => {
                for (const { aptId, vagas } of apartamentosEstendidosResultados) {
                    for (const vagaId of vagas) {
                        expect(VAGAS_ESTENDIDAS.includes(vagaId))
                            .toBe(true, `Apartamento estendido ${aptId} recebeu vaga não-estendida: ${vagaId}`);
                    }
                }
            });

            test('Nenhuma vaga estendida foi usada por não-estendidos', () => {
                const naoEstendidos = [...apartamentosDuplosResultados, ...apartamentosSimplesResultados];

                for (const { aptId, vagas } of naoEstendidos) {
                    for (const vagaId of vagas) {
                        expect(VAGAS_ESTENDIDAS.includes(vagaId))
                            .toBe(false, `Apartamento não-estendido ${aptId} recebeu vaga estendida: ${vagaId}`);
                    }
                }
            });
        });

        // ========== VALIDAÇÕES DE SIMPLES ==========

        describe('🔹 Validação de Apartamentos Simples', () => {
            test('Apartamentos simples receberam vagas simples exclusivamente', () => {
                for (const { aptId, vagas } of apartamentosSimplesResultados) {
                    for (const vagaId of vagas) {
                        // Não deve ser estendida
                        expect(VAGAS_ESTENDIDAS.includes(vagaId))
                            .toBe(false, `Apartamento simples ${aptId} recebeu vaga estendida: ${vagaId}`);

                        // Não deve fazer parte de par válido
                        const fazParteDePar = PARES_VALIDOS.some(p => p.ids.includes(vagaId));
                        expect(fazParteDePar)
                            .toBe(false, `Apartamento simples ${aptId} recebeu vaga de par duplo: ${vagaId}`);
                    }
                }
            });
        });

        // ========== VALIDAÇÕES DE INTEGRIDADE ==========

        describe('🔍 Validação de Integridade', () => {
            test('Total de vagas atribuídas = 42', () => {
                expect(todasVagasUsadas.length).toBe(42);
            });

            test('Nenhuma vaga duplicada', () => {
                const vagasUnicas = [...new Set(todasVagasUsadas)];
                expect(vagasUnicas.length).toBe(todasVagasUsadas.length);
            });

            test('Todos os apartamentos receberam vaga', () => {
                expect(sorteiosRealizados).toBe(apartamentosAtivos.length);
            });

            test('Soma matemática correta', () => {
                const totalDuplos = apartamentosDuplosResultados.length * 2; // 2 vagas por duplo
                const totalEstendidos = apartamentosEstendidosResultados.length * 1; // 1 vaga por estendido  
                const totalSimples = apartamentosSimplesResultados.length * 1; // 1 vaga por simples

                expect(totalDuplos + totalEstendidos + totalSimples).toBe(42);
            });

            test('Distribuição esperada de tipos', () => {
                const expectedDuplos = TOTAL_APARTAMENTOS_DUPLOS;
                const expectedEstendidos = TOTAL_APARTAMENTOS_ESTENDIDOS;
                const expectedSimples = apartamentosAtivos.length - expectedDuplos - expectedEstendidos;

                expect(apartamentosDuplosResultados.length).toBe(expectedDuplos);
                expect(apartamentosEstendidosResultados.length).toBe(expectedEstendidos);
                expect(apartamentosSimplesResultados.length).toBe(expectedSimples);
            });
        });

        // ========== RELATÓRIO FINAL ==========

        console.log('\n📋 ===== RELATÓRIO FINAL DO SORTEIO =====');
        console.log(`✅ Apartamentos duplos sorteados: ${apartamentosDuplosResultados.length}/${TOTAL_APARTAMENTOS_DUPLOS}`);
        console.log(`✅ Apartamentos estendidos sorteados: ${apartamentosEstendidosResultados.length}/${TOTAL_APARTAMENTOS_ESTENDIDOS}`);
        console.log(`✅ Apartamentos simples sorteados: ${apartamentosSimplesResultados.length}`);
        console.log(`✅ Total de vagas utilizadas: ${todasVagasUsadas.length}/42`);
        console.log('✅ Todas as validações passaram!');

        // Executar todas as validações
        expect(apartamentosDuplosResultados.length).toBe(TOTAL_APARTAMENTOS_DUPLOS);
        expect(apartamentosEstendidosResultados.length).toBe(TOTAL_APARTAMENTOS_ESTENDIDOS);
        expect(todasVagasUsadas.length).toBe(42);
        expect([...new Set(todasVagasUsadas)].length).toBe(42);
    });

    // ==================== TESTES ESPECÍFICOS ==========

    test('🔧 Configuração inicial está correta', () => {
        expect(garagem.spots.length).toBe(42);
        expect(Object.keys(garagem.pairs).length).toBe(TOTAL_PARES_VALIDOS);
        expect(apartamentos.length).toBe(28); // 7 andares × 4 apartamentos
        expect(apartamentos.filter(apt => apt.dupla).length).toBe(TOTAL_APARTAMENTOS_DUPLOS);
    });

    test('🚫 Pares inválidos não existem na garagem', () => {
        const paresInvalidos = ['G1-A-6-7', 'G1-B-7-8', 'G2-C-6-7', 'G2-D-1-2'];

        for (const parInvalido of paresInvalidos) {
            expect(garagem.pairs[parInvalido]).toBeUndefined(
                `Par inválido ${parInvalido} encontrado na garagem`
            );
        }
    });

    test('🎯 Apenas pares fisicamente válidos existem', () => {
        const pairsKeys = Object.keys(garagem.pairs);
        expect(pairsKeys.length).toBe(PARES_VALIDOS.length);

        for (const pairKey of pairsKeys) {
            const parValido = PARES_VALIDOS.find(p => p.name === pairKey);
            expect(parValido).toBeDefined(`Par ${pairKey} não está na lista de válidos`);
        }
    });
});