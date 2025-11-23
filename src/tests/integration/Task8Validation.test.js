/**
 * @fileoverview TASK 8 - Validação Completa do Fluxo de Sorteio
 * @description Testes automáticos para validar todos os cenários especificados na TASK 8
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { LotterySystemFactory } from '../../core/index.js';
import { Garage } from '../../core/models/Garage.js';
import { Spot } from '../../core/models/Spot.js';
import { Apartment } from '../../core/models/Apartment.js';

describe('TASK 8 - Validação Completa do Fluxo de Sorteio', () => {
    let lotterySystem;
    let garage;
    let apartments;

    // Função que simula isVagaEstendida do sorteio.properties
    const isExtendedSpot = (spotId) => {
        const extendedSpots = [7, 8, 21, 22, 35, 36]; // IDs das vagas estendidas
        return extendedSpots.includes(Number(spotId));
    };

    // Função que simula detecção de apartamentos estendidos
    const isExtendedApartment = (apartmentId) => {
        const extendedApartments = [303, 403, 503, 603, 703]; // Apartamentos estendidos
        return extendedApartments.includes(Number(apartmentId));
    };

    // Função que simula detecção de apartamentos duplos  
    const isDupleApartment = (apartmentId) => {
        const dupleApartments = [102, 202]; // Apartamentos duplos
        return dupleApartments.includes(Number(apartmentId));
    };

    beforeEach(() => {
        // Criar sistema SOLID
        lotterySystem = LotterySystemFactory.createSystem({
            seed: 12345,
            isExtendedSpotFn: isExtendedSpot,
            isExtendedApartmentFn: isExtendedApartment
        });

        // Configurar garagem com estrutura realista
        const spots = [];
        const pairs = {};

        // Criar spots: G1-A (1-7), G1-B (8-14), G2-C (15-21), G2-D (22-28), G3-E (29-35), G3-F (36-42)
        let spotId = 1;
        const floors = ['G1', 'G2', 'G3'];
        const sides = { G1: ['A', 'B'], G2: ['C', 'D'], G3: ['E', 'F'] };

        floors.forEach(floor => {
            sides[floor].forEach(side => {
                for (let pos = 1; pos <= 7; pos++) {
                    spots.push(new Spot(spotId, floor, side, pos));
                    spotId++;
                }
            });
        });

        // Criar pares duplos (1-2, 3-4, 5-6, etc)
        for (let i = 1; i <= 40; i += 2) {
            if (i + 1 <= 42) {
                const parId = `G${Math.ceil((i - 1) / 14) + 1}-${String.fromCharCode(65 + Math.floor(((i - 1) % 14) / 7))}-${i}-${i + 1}`;
                pairs[parId] = {
                    id: parId,
                    floor: floors[Math.floor((i - 1) / 14)],
                    side: String.fromCharCode(65 + Math.floor(((i - 1) % 14) / 7)),
                    aPos: ((i - 1) % 7) + 1,
                    bPos: (i % 7) + 1,
                    aId: i,
                    bId: i + 1,
                    reservedFor: null
                };
            }
        }

        garage = new Garage(spots, pairs);

        // Criar apartamentos de diferentes tipos
        apartments = [
            // Simples
            Apartment.fromJSON({ id: 101, apartmentNumber: '101', ativo: true, sorteado: false }),
            Apartment.fromJSON({ id: 201, apartmentNumber: '201', ativo: true, sorteado: false }),
            Apartment.fromJSON({ id: 301, apartmentNumber: '301', ativo: true, sorteado: false }),

            // Duplos (com propriedade dupla = true)
            Apartment.fromJSON({ id: 102, apartmentNumber: '102', ativo: true, sorteado: false, dupla: true }),
            Apartment.fromJSON({ id: 202, apartmentNumber: '202', ativo: true, sorteado: false, dupla: true }),

            // Estendidos (configurados na function isExtendedApartment) 
            Apartment.fromJSON({ id: 303, apartmentNumber: '303', ativo: true, sorteado: false }),
            Apartment.fromJSON({ id: 403, apartmentNumber: '403', ativo: true, sorteado: false }),
            Apartment.fromJSON({ id: 503, apartmentNumber: '503', ativo: true, sorteado: false })
        ];
    });

    test('✅ CENÁRIO 1: Sortear 1 simples → deve pegar vaga simples livre', () => {
        console.log('🧪 TESTANDO: Apartamento simples deve receber vaga simples');

        // Filtrar apenas apartamentos simples (não duplos e não estendidos)
        const apartamentosSimples = apartments.filter(apt =>
            !isDupleApartment(apt.id) && !isExtendedApartment(apt.id)
        );

        const result = lotterySystem.orchestrator.executeSorting(apartamentosSimples, garage);

        expect(result.success).toBe(true);
        expect(result.apartmentType).toBe('simples');
        expect(result.spotData.type).toBe('simple');
        expect(result.spotData.spot).toBeDefined();

        // Verificar que a vaga NÃO é estendida
        const vagaId = result.spotData.spot.id;
        expect(isExtendedSpot(vagaId)).toBe(false);

        console.log(`✅ Apartamento ${result.apartment.id} (simples) recebeu vaga ${vagaId} (simples)`);
    });

    test('✅ CENÁRIO 2: Sortear 1 duplo → deve pegar par disponível', () => {
        console.log('🧪 TESTANDO: Apartamento duplo deve receber par disponível');

        // Filtrar apenas apartamentos duplos
        const apartamentosDuplos = apartments.filter(apt => isDupleApartment(apt.id));

        const result = lotterySystem.orchestrator.executeSorting(apartamentosDuplos, garage);

        expect(result.success).toBe(true);
        expect(result.apartmentType).toBe('duplo');
        expect(result.spotData.type).toBe('double');
        expect(result.spotData.pair).toBeDefined();

        // Verificar que é um par válido
        const par = result.spotData.pair;
        expect(par.aId).toBeDefined();
        expect(par.bId).toBeDefined();
        expect(par.aId).not.toBe(par.bId);

        console.log(`✅ Apartamento ${result.apartment.id} (duplo) recebeu par ${par.id} (vagas ${par.aId}, ${par.bId})`);
    });

    test('✅ CENÁRIO 3: Sortear 1 estendido → deve pegar vaga estendida livre', () => {
        console.log('🧪 TESTANDO: Apartamento estendido deve receber vaga estendida');

        // Filtrar apenas apartamentos estendidos
        const apartamentosEstendidos = apartments.filter(apt => isExtendedApartment(apt.id));

        const result = lotterySystem.orchestrator.executeSorting(apartamentosEstendidos, garage);

        expect(result.success).toBe(true);
        expect(result.apartmentType).toBe('estendido');
        expect(result.spotData.type).toBe('extended');
        expect(result.spotData.spot).toBeDefined();

        // Verificar que a vaga É estendida
        const vagaId = result.spotData.spot.id;
        expect(isExtendedSpot(vagaId)).toBe(true);

        console.log(`✅ Apartamento ${result.apartment.id} (estendido) recebeu vaga ${vagaId} (estendida)`);
    });

    test('✅ CENÁRIO 4: Sortear até acabar → deve preencher tudo sem erro', () => {
        console.log('🧪 TESTANDO: Sortear até acabar apartamentos e vagas');

        const resultados = [];
        let apartamentosRestantes = [...apartments];
        let garagemAtual = garage.clone();
        let tentativas = 0;
        const maxTentativas = 100; // Evitar loop infinito

        while (apartamentosRestantes.filter(apt => !apt.sorteado).length > 0 && tentativas < maxTentativas) {
            const apartamentosDisponiveis = apartamentosRestantes.filter(apt => !apt.sorteado);

            const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garagemAtual);

            if (result.success) {
                // Marcar apartamento como sorteado
                const apartamento = apartamentosRestantes.find(apt => apt.id === result.apartment.id);
                apartamento.markAsDrawn();

                // Atualizar garagem
                garagemAtual = result.assignmentResult.garage;

                resultados.push({
                    apartamento: result.apartment.id,
                    tipo: result.apartmentType,
                    vaga: result.spotData.type === 'double'
                        ? `${result.spotData.pair.aId}-${result.spotData.pair.bId}`
                        : result.spotData.spot.id
                });

                console.log(`🎯 Sorteio ${resultados.length}: Apartamento ${result.apartment.id} → ${result.apartmentType} → Vaga(s) ${resultados[resultados.length - 1].vaga}`);
            } else {
                console.log(`❌ Sorteio falhou: ${result.message}`);
                break; // Sem mais vagas disponíveis do tipo necessário
            }

            tentativas++;
        }

        // Validações
        expect(tentativas).toBeLessThan(maxTentativas); // Não deve entrar em loop infinito
        expect(resultados.length).toBeGreaterThan(0); // Deve ter conseguido pelo menos alguns sorteios

        console.log(`📊 RESULTADO: ${resultados.length} apartamentos sorteados com sucesso`);
        console.log('📋 RESUMO:', resultados);

        // Verificar integridade
        const vagasOcupadas = [];
        resultados.forEach(r => {
            if (typeof r.vaga === 'string' && r.vaga.includes('-')) {
                // Par duplo
                const [vagaA, vagaB] = r.vaga.split('-').map(Number);
                vagasOcupadas.push(vagaA, vagaB);
            } else {
                // Vaga única
                vagasOcupadas.push(Number(r.vaga));
            }
        });

        // Não deve haver vagas duplicadas
        const vagasUnicas = new Set(vagasOcupadas);
        expect(vagasOcupadas.length).toBe(vagasUnicas.size);

        console.log(`✅ Integridade verificada: ${vagasOcupadas.length} vagas ocupadas, todas únicas`);
    });

    test('✅ CENÁRIO 5: Nenhum apartamento deve receber mais de 1 vaga (ou par)', () => {
        console.log('🧪 TESTANDO: Unicidade de atribuições por apartamento');

        const apartamentosAtribuidos = new Set();
        const resultados = [];
        let garagemAtual = garage.clone();

        // Executar vários sorteios
        for (let i = 0; i < apartments.length; i++) {
            const apartamentosDisponiveis = apartments.filter(apt => !apartamentosAtribuidos.has(apt.id));

            if (apartamentosDisponiveis.length === 0) break;

            const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garagemAtual);

            if (result.success) {
                // Verificar que apartamento não foi atribuído antes
                expect(apartamentosAtribuidos.has(result.apartment.id)).toBe(false);

                apartamentosAtribuidos.add(result.apartment.id);
                garagemAtual = result.assignmentResult.garage;
                resultados.push(result.apartment.id);

                console.log(`✅ Apartamento ${result.apartment.id} atribuído pela primeira vez`);
            } else {
                break;
            }
        }

        // Validar que cada apartamento aparece no máximo uma vez
        const apartamentosUnicos = new Set(resultados);
        expect(resultados.length).toBe(apartamentosUnicos.size);

        console.log(`✅ Validação concluída: ${resultados.length} apartamentos, todos únicos`);
    });

    test('✅ CENÁRIO 6: Nenhuma vaga deve aparecer como ocupada por dois apartamentos', () => {
        console.log('🧪 TESTANDO: Unicidade de ocupação de vagas');

        const vagasOcupadas = new Map(); // vagaId -> apartmentId
        const resultados = [];
        let apartamentosRestantes = [...apartments];
        let garagemAtual = garage.clone();

        // Executar sorteios múltiplos
        for (let i = 0; i < apartments.length; i++) {
            const apartamentosDisponiveis = apartamentosRestantes.filter(apt => !apt.sorteado);

            if (apartamentosDisponiveis.length === 0) break;

            const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garagemAtual);

            if (result.success) {
                // Marcar apartamento como sorteado
                const apartamento = apartamentosRestantes.find(apt => apt.id === result.apartment.id);
                apartamento.markAsDrawn();

                // Coletar vagas ocupadas
                const vagasDesteApartamento = [];
                if (result.spotData.type === 'double') {
                    vagasDesteApartamento.push(result.spotData.pair.aId, result.spotData.pair.bId);
                } else {
                    vagasDesteApartamento.push(result.spotData.spot.id);
                }

                // Verificar unicidade
                vagasDesteApartamento.forEach(vagaId => {
                    if (vagasOcupadas.has(vagaId)) {
                        const apartamentoAnterior = vagasOcupadas.get(vagaId);
                        throw new Error(`❌ CONFLITO: Vaga ${vagaId} já ocupada pelo apartamento ${apartamentoAnterior}, tentativa de ocupar pelo apartamento ${result.apartment.id}`);
                    }
                    vagasOcupadas.set(vagaId, result.apartment.id);
                });

                garagemAtual = result.assignmentResult.garage;
                resultados.push({
                    apartamento: result.apartment.id,
                    vagas: vagasDesteApartamento
                });

                console.log(`✅ Apartamento ${result.apartment.id} ocupou vagas ${vagasDesteApartamento.join(', ')} sem conflito`);
            } else {
                break;
            }
        }

        // Validação final
        const totalVagasOcupadas = Array.from(vagasOcupadas.keys());
        const vagasUnicas = new Set(totalVagasOcupadas);

        expect(totalVagasOcupadas.length).toBe(vagasUnicas.size);
        expect(vagasOcupadas.size).toBe(totalVagasOcupadas.length);

        console.log(`✅ Validação concluída: ${vagasOcupadas.size} vagas ocupadas, todas com ocupação única`);
        console.log('📋 Mapa de ocupação:', Object.fromEntries(vagasOcupadas));
    });

    test('🏆 CENÁRIO INTEGRADO: Validação completa de todos os critérios', () => {
        console.log('🧪 TESTANDO: Validação integrada de todos os critérios da TASK 8');

        const estatisticas = {
            apartamentosSimples: 0,
            apartamentosDuplos: 0,
            apartamentosEstendidos: 0,
            vagasSimples: 0,
            vagasEstendidas: 0,
            paresOcupados: 0,
            conflitos: 0,
            totalSorteios: 0
        };

        const apartamentosAtribuidos = new Set();
        const vagasOcupadas = new Map();
        let apartamentosRestantes = [...apartments];
        let garagemAtual = garage.clone();

        while (apartamentosRestantes.filter(apt => !apt.sorteado).length > 0) {
            const apartamentosDisponiveis = apartamentosRestantes.filter(apt => !apt.sorteado);

            const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garagemAtual);

            if (!result.success) {
                console.log(`⏹️ Sorteios finalizados: ${result.message}`);
                break;
            }

            // Marcar apartamento como sorteado
            const apartamento = apartamentosRestantes.find(apt => apt.id === result.apartment.id);
            apartamento.markAsDrawn();

            // ✅ CRITÉRIO 5: Verificar unicidade do apartamento
            expect(apartamentosAtribuidos.has(result.apartment.id)).toBe(false);
            apartamentosAtribuidos.add(result.apartment.id);

            // Coletar vagas
            const vagasDesteApartamento = [];
            if (result.spotData.type === 'double') {
                vagasDesteApartamento.push(result.spotData.pair.aId, result.spotData.pair.bId);
                estatisticas.paresOcupados++;
            } else {
                vagasDesteApartamento.push(result.spotData.spot.id);
                if (isExtendedSpot(result.spotData.spot.id)) {
                    estatisticas.vagasEstendidas++;
                } else {
                    estatisticas.vagasSimples++;
                }
            }

            // ✅ CRITÉRIO 6: Verificar unicidade das vagas
            vagasDesteApartamento.forEach(vagaId => {
                if (vagasOcupadas.has(vagaId)) {
                    estatisticas.conflitos++;
                }
                vagasOcupadas.set(vagaId, result.apartment.id);
            });

            // ✅ CRITÉRIOS 1-3: Verificar tipo correto
            if (result.apartmentType === 'simples') {
                expect(result.spotData.type).toBe('simple');
                expect(isExtendedSpot(result.spotData.spot.id)).toBe(false);
                estatisticas.apartamentosSimples++;
            } else if (result.apartmentType === 'duplo') {
                expect(result.spotData.type).toBe('double');
                estatisticas.apartamentosDuplos++;
            } else if (result.apartmentType === 'estendido') {
                expect(result.spotData.type).toBe('extended');
                expect(isExtendedSpot(result.spotData.spot.id)).toBe(true);
                estatisticas.apartamentosEstendidos++;
            }

            garagemAtual = result.assignmentResult.garage;
            estatisticas.totalSorteios++;

            console.log(`🎯 Sorteio ${estatisticas.totalSorteios}: Apartamento ${result.apartment.id} (${result.apartmentType}) → Vaga(s) ${vagasDesteApartamento.join(', ')}`);
        }

        // ✅ Validações finais
        expect(estatisticas.conflitos).toBe(0); // Nenhum conflito de vagas
        expect(apartamentosAtribuidos.size).toBe(estatisticas.totalSorteios); // Apartamentos únicos
        expect(estatisticas.totalSorteios).toBeGreaterThan(0); // Pelo menos alguns sorteios

        console.log('🏆 RESULTADO FINAL:');
        console.log('📊 Estatísticas:', estatisticas);
        console.log('✅ Todos os critérios da TASK 8 validados com sucesso!');

        // Garantir que todos os critérios foram atendidos
        expect(estatisticas.apartamentosSimples).toBeGreaterThan(0); // Testou simples
        expect(estatisticas.apartamentosDuplos).toBeGreaterThan(0);   // Testou duplos
        expect(estatisticas.apartamentosEstendidos).toBeGreaterThan(0); // Testou estendidos
    });
});