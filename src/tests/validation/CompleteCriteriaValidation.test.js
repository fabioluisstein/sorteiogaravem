import { describe, test, expect, beforeEach } from 'vitest';
import { LotterySystemFactory } from '../../core/index.js';
import { Apartment } from '../../core/models/Apartment.js';
import { Garage } from '../../core/models/Garage.js';

describe('✅ VALIDAÇÃO COMPLETA DOS CRITÉRIOS - NOVO SORTEIO DE GARAGENS', () => {
    let lotterySystem;
    let testApartments;
    let testGarage;

    // Helper para criar apartamentos de teste
    const createTestApartments = () => {
        const apartments = [];

        // Apartamentos simples (sem direito a dupla)
        [101, 103, 104, 201, 203, 204, 301, 303, 304].forEach(num => {
            apartments.push(new Apartment(num, num.toString(), true, false));
        });

        // Apartamentos duplos (com direito a dupla)
        [102, 202, 302].forEach(num => {
            apartments.push(new Apartment(num, num.toString(), true, true));
        });

        // Apartamentos estendidos (403, 503, 603, 703 - sempre coluna 3 nos andares 4+)
        [403, 503, 603, 703].forEach(num => {
            apartments.push(new Apartment(num, num.toString(), true, false));
        });

        return apartments;
    };

    // Helper para criar garagem de teste
    const createTestGarage = () => {
        const spots = [];
        const pairs = [];

        // Criar spots normais
        for (let i = 1; i <= 20; i++) {
            spots.push({
                id: i,
                floor: 1,
                side: 'A',
                pos: i,
                occupiedBy: null,
                isExtended: false
            });
        }

        // Criar spots estendidos
        for (let i = 21; i <= 26; i++) {
            spots.push({
                id: i,
                floor: 1,
                side: 'A',
                pos: i,
                occupiedBy: null,
                isExtended: true
            });
        }

        // Criar pares válidos (spots normais consecutivos)
        for (let i = 1; i <= 19; i += 2) {
            pairs.push({
                aId: i,
                bId: i + 1,
                id: `P${i}-${i + 1}`,
                floor: 1,
                side: 'A',
                isOccupied: false
            });
        }

        return new Garage(spots, pairs);
    };

    // Helper para função de vaga estendida
    const isVagaEstendida = (spotId) => spotId >= 21 && spotId <= 26;

    beforeEach(() => {
        lotterySystem = LotterySystemFactory.createSystem({
            seed: Date.now(),
            isExtendedSpotFn: isVagaEstendida
        });
        testApartments = createTestApartments();
        testGarage = createTestGarage();
    });

    describe('1️⃣ CRITÉRIO 1: Seleção do apartamento', () => {
        test('Sistema sorteia apenas apartamentos não sorteados', () => {
            console.log('🧪 Testando: Sorteio apenas de apartamentos não sorteados');

            // Marcar alguns apartamentos como já sorteados
            testApartments[0].markAsDrawn([1]); // Apartamento 101 já sorteado
            testApartments[1].markAsDrawn([2]); // Apartamento 103 já sorteado

            const availableBefore = testApartments.filter(apt => apt.isAvailableForDraw()).length;
            console.log(`📊 Apartamentos disponíveis antes: ${availableBefore}`);

            const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);

            expect(result.success).toBe(true);
            expect(result.apartment.isAvailableForDraw()).toBe(false); // Agora está sorteado

            // Não deve sortear apartamentos já marcados como sorteados
            expect([101, 103]).not.toContain(result.apartment.id);

            console.log(`✅ Apartamento ${result.apartment.id} sorteado corretamente (não estava previamente sorteado)`);
        });

        test('Escolha é randômica, não sequencial', () => {
            console.log('🧪 Testando: Aleatoriedade na seleção de apartamentos');

            const results = new Set();
            const iterations = 10;

            for (let i = 0; i < iterations; i++) {
                const freshApartments = createTestApartments();
                const freshGarage = createTestGarage();
                const freshSystem = LotterySystemFactory.createSystem({
                    seed: Date.now() + i,
                    isExtendedSpotFn: isVagaEstendida
                });

                const result = freshSystem.orchestrator.executeSorting(freshApartments, freshGarage);
                if (result.success) {
                    results.add(result.apartment.id);
                }
            }

            console.log(`📊 Apartamentos sorteados em ${iterations} execuções: ${[...results].sort()}`);

            // Deve haver variação (pelo menos 3 apartamentos diferentes)
            expect(results.size).toBeGreaterThanOrEqual(3);
            console.log(`✅ Aleatoriedade confirmada: ${results.size} apartamentos diferentes sorteados`);
        });

        test('Apartamento sai do pool após receber vaga', () => {
            console.log('🧪 Testando: Remoção do pool após sorteio');

            const apartmentId = testApartments[0].id;
            const availableBefore = testApartments.filter(apt => apt.isAvailableForDraw()).length;

            const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
            expect(result.success).toBe(true);

            const availableAfter = testApartments.filter(apt => apt.isAvailableForDraw()).length;

            expect(availableAfter).toBe(availableBefore - 1);
            expect(result.apartment.isAvailableForDraw()).toBe(false);

            console.log(`✅ Pool reduzido de ${availableBefore} para ${availableAfter} apartamentos`);
        });
    });

    describe('2️⃣ CRITÉRIO 2: Identificação do tipo do apartamento', () => {
        test('Sistema reconhece apartamentos simples corretamente', () => {
            console.log('🧪 Testando: Reconhecimento de apartamentos simples');

            const simplesApartments = testApartments.filter(apt =>
                [101, 103, 104, 201, 203, 204, 301, 303, 304].includes(apt.id)
            );

            for (const apt of simplesApartments) {
                expect(apt.dupla).toBe(false);
                expect(apt.isExtended(isVagaEstendida)).toBe(false);
                console.log(`✅ Apartamento ${apt.id}: simples`);
            }
        });

        test('Sistema reconhece apartamentos duplos corretamente', () => {
            console.log('🧪 Testando: Reconhecimento de apartamentos duplos');

            const duploApartments = testApartments.filter(apt =>
                [102, 202, 302].includes(apt.id)
            );

            for (const apt of duploApartments) {
                expect(apt.dupla).toBe(true);
                expect(apt.isExtended(isVagaEstendida)).toBe(false);
                console.log(`✅ Apartamento ${apt.id}: duplo`);
            }
        });

        test('Sistema reconhece apartamentos estendidos corretamente', () => {
            console.log('🧪 Testando: Reconhecimento de apartamentos estendidos');

            const estendidoApartments = testApartments.filter(apt =>
                [403, 503, 603, 703].includes(apt.id)
            );

            for (const apt of estendidoApartments) {
                expect(apt.dupla).toBe(false);
                expect(apt.isExtended(isVagaEstendida)).toBe(true);
                console.log(`✅ Apartamento ${apt.id}: estendido`);
            }
        });
    });

    describe('3️⃣ CRITÉRIO 3: Listagem de vagas disponíveis', () => {
        test('Simples: Lista apenas vagas normais não ocupadas', () => {
            console.log('🧪 Testando: Filtragem de vagas para apartamentos simples');

            // Ocupar algumas vagas normais e estendidas
            testGarage.spots[0].occupiedBy = 999; // Vaga normal ocupada
            testGarage.spots[20].occupiedBy = 999; // Vaga estendida ocupada

            const normalSpots = testGarage.getAvailableNormalSpots();

            // Deve ter vagas normais livres (19 restantes após ocupar 1)
            expect(normalSpots.length).toBe(19);

            // Nenhuma vaga listada deve ser estendida ou ocupada
            for (const spot of normalSpots) {
                expect(spot.isExtended).toBe(false);
                expect(spot.occupiedBy).toBeNull();
            }

            console.log(`✅ ${normalSpots.length} vagas normais livres listadas corretamente`);
        });

        test('Duplo: Lista apenas pares válidos sem vagas estendidas', () => {
            console.log('🧪 Testando: Filtragem de pares para apartamentos duplos');

            // Ocupar uma vaga de um par
            testGarage.spots[1].occupiedBy = 999; // Vaga 2 ocupada (par 1-2 inválido)

            const availablePairs = testGarage.getFilteredFreePairs(isVagaEstendida);

            // Deve ter 8 pares livres (9 originais - 1 ocupado)  
            expect(availablePairs.length).toBe(8);

            // Verificar que nenhum par contém vagas estendidas
            for (const pair of availablePairs) {
                expect(isVagaEstendida(pair.aId)).toBe(false);
                expect(isVagaEstendida(pair.bId)).toBe(false);
            }

            console.log(`✅ ${availablePairs.length} pares válidos (sem estendidas) listados`);
        });

        test('Estendido: Lista apenas vagas estendidas livres', () => {
            console.log('🧪 Testando: Filtragem de vagas estendidas');

            // Ocupar algumas vagas estendidas
            testGarage.spots[20].occupiedBy = 999; // Vaga estendida 21 ocupada
            testGarage.spots[21].occupiedBy = 999; // Vaga estendida 22 ocupada

            const extendedSpots = testGarage.getAvailableExtendedSpots(isVagaEstendida);

            // Deve ter 4 vagas estendidas livres (6 originais - 2 ocupadas)
            expect(extendedSpots.length).toBe(4);

            // Todas devem ser estendidas e livres
            for (const spot of extendedSpots) {
                expect(isVagaEstendida(spot.id)).toBe(true);
                expect(spot.occupiedBy).toBeNull();
            }

            console.log(`✅ ${extendedSpots.length} vagas estendidas livres listadas corretamente`);
        });
    });

    describe('4️⃣ CRITÉRIO 4: Sorteio das vagas', () => {
        test('Vaga sorteada é sempre randômica', () => {
            console.log('🧪 Testando: Aleatoriedade no sorteio de vagas');

            const results = new Set();
            const iterations = 15;

            for (let i = 0; i < iterations; i++) {
                const freshApartments = createTestApartments();
                const freshGarage = createTestGarage();
                const freshSystem = LotterySystemFactory.createSystem({
                    seed: Date.now() + i * 1000,
                    isExtendedSpotFn: isVagaEstendida
                });

                const result = freshSystem.orchestrator.executeSorting(freshApartments, freshGarage);
                if (result.success) {
                    const vagaInfo = result.spotData.type === 'double'
                        ? `${result.spotData.pair.aId}-${result.spotData.pair.bId}`
                        : result.spotData.spot.id.toString();
                    results.add(vagaInfo);
                }
            }

            console.log(`📊 Vagas sorteadas em ${iterations} execuções: ${[...results].sort()}`);

            // Deve haver variação substancial
            expect(results.size).toBeGreaterThanOrEqual(5);
            console.log(`✅ Aleatoriedade confirmada: ${results.size} vagas/pares diferentes`);
        });

        test('Nunca escolhe vaga ocupada', () => {
            console.log('🧪 Testando: Exclusão de vagas ocupadas');

            // Ocupar várias vagas
            for (let i = 0; i < 5; i++) {
                testGarage.spots[i].occupiedBy = 999;
            }

            // Executar múltiplos sorteios
            for (let i = 0; i < 10; i++) {
                const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
                if (result.success) {
                    const vagasUsadas = result.spotData.type === 'double'
                        ? [result.spotData.pair.aId, result.spotData.pair.bId]
                        : [result.spotData.spot.id];

                    for (const vagaId of vagasUsadas) {
                        const spot = testGarage.spots.find(s => s.id === vagaId);
                        expect(spot.occupiedBy).toBeNull(); // Não deve estar previamente ocupada
                    }
                }
            }

            console.log('✅ Nenhuma vaga ocupada foi selecionada');
        });

        test('Apartamentos duplos recebem exatamente um par', () => {
            console.log('🧪 Testando: Apartamentos duplos recebem um par');

            // Forçar sorteio de apartamento duplo
            const duploApartments = testApartments.filter(apt => apt.dupla);
            const resultado = lotterySystem.orchestrator.executeSorting(duploApartments, testGarage);

            expect(resultado.success).toBe(true);
            expect(resultado.apartment.dupla).toBe(true);
            expect(resultado.spotData.type).toBe('double');
            expect(resultado.spotData.pair).toBeDefined();
            expect(resultado.spotData.pair.aId).toBeDefined();
            expect(resultado.spotData.pair.bId).toBeDefined();

            console.log(`✅ Apartamento duplo ${resultado.apartment.id} recebeu par ${resultado.spotData.pair.aId}-${resultado.spotData.pair.bId}`);
        });
    });

    describe('5️⃣ CRITÉRIO 5: Atribuição', () => {
        test('Vagas são marcadas como ocupadas após sorteio', () => {
            console.log('🧪 Testando: Marcação de ocupação após sorteio');

            const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
            expect(result.success).toBe(true);

            const vagasUsadas = result.spotData.type === 'double'
                ? [result.spotData.pair.aId, result.spotData.pair.bId]
                : [result.spotData.spot.id];

            for (const vagaId of vagasUsadas) {
                const spot = testGarage.spots.find(s => s.id === vagaId);
                expect(spot.occupiedBy).toBe(result.apartment.id);
            }

            console.log(`✅ Vagas ${vagasUsadas.join(', ')} marcadas como ocupadas por apartamento ${result.apartment.id}`);
        });

        test('Apartamento muda para status sorteado', () => {
            console.log('🧪 Testando: Mudança de status para sorteado');

            const apartmentBefore = testApartments[0];
            expect(apartmentBefore.isAvailableForDraw()).toBe(true);

            const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
            expect(result.success).toBe(true);
            expect(result.apartment.isAvailableForDraw()).toBe(false);

            console.log(`✅ Apartamento ${result.apartment.id} mudou status para sorteado`);
        });

        test('Nenhum apartamento recebe múltiplas atribuições', () => {
            console.log('🧪 Testando: Prevenção de múltiplas atribuições');

            const apartmentId = testApartments[0].id;
            const apartmentToTest = testApartments.find(apt => apt.id === apartmentId);

            // Primeiro sorteio
            apartmentToTest.markAsDrawn([1]);
            expect(apartmentToTest.isAvailableForDraw()).toBe(false);

            // Tentar sortear novamente - apartamento não deve estar disponível
            const availableApartments = testApartments.filter(apt => apt.isAvailableForDraw());
            expect(availableApartments).not.toContain(apartmentToTest);

            console.log(`✅ Apartamento ${apartmentId} corretamente removido do pool após primeira atribuição`);
        });
    });

    describe('6️⃣ CRITÉRIO 6: Silêncio durante o processo', () => {
        test('Não mostra erro quando vagas estão disponíveis', () => {
            console.log('🧪 Testando: Ausência de mensagens de erro indevidas');

            // Capturar console.error e console.warn
            const originalError = console.error;
            const originalWarn = console.warn;
            const errors = [];
            const warnings = [];

            console.error = (...args) => errors.push(args.join(' '));
            console.warn = (...args) => warnings.push(args.join(' '));

            try {
                // Executar sorteios enquanto há vagas disponíveis
                let sorteiosRealizados = 0;
                for (let i = 0; i < 10; i++) {
                    const availableApartments = testApartments.filter(apt => apt.isAvailableForDraw());
                    if (availableApartments.length === 0) break;

                    const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
                    if (result.success) {
                        sorteiosRealizados++;
                    }
                }

                // Filtrar apenas mensagens de erro relacionadas ao sorteio
                const sorteioErrors = errors.filter(err =>
                    err.includes('já está ocupada') ||
                    err.includes('Não há vagas') ||
                    err.includes('reservada')
                );

                const sorteioWarnings = warnings.filter(warn =>
                    warn.includes('reprocessamento') ||
                    warn.includes('ocupada')
                );

                expect(sorteioErrors.length).toBe(0);
                expect(sorteioWarnings.length).toBe(0);

                console.log(`✅ ${sorteiosRealizados} sorteios executados sem mensagens de erro indevidas`);

            } finally {
                console.error = originalError;
                console.warn = originalWarn;
            }
        });
    });

    describe('7️⃣ CRITÉRIO 7: Consistência do sorteio', () => {
        test('Nenhuma vaga é usada por dois apartamentos', () => {
            console.log('🧪 Testando: Unicidade de ocupação de vagas');

            const vagasOcupadas = new Map();

            // Executar múltiplos sorteios
            for (let i = 0; i < 8; i++) {
                const availableApartments = testApartments.filter(apt => apt.isAvailableForDraw());
                if (availableApartments.length === 0) break;

                const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
                if (result.success) {
                    const vagasUsadas = result.spotData.type === 'double'
                        ? [result.spotData.pair.aId, result.spotData.pair.bId]
                        : [result.spotData.spot.id];

                    for (const vagaId of vagasUsadas) {
                        if (vagasOcupadas.has(vagaId)) {
                            throw new Error(`Vaga ${vagaId} ocupada por múltiplos apartamentos: ${vagasOcupadas.get(vagaId)} e ${result.apartment.id}`);
                        }
                        vagasOcupadas.set(vagaId, result.apartment.id);
                    }
                }
            }

            console.log(`✅ ${vagasOcupadas.size} vagas ocupadas, todas por apartamentos únicos`);
        });

        test('Apartamentos recebem vagas do tipo correto', () => {
            console.log('🧪 Testando: Match correto tipo apartamento-vaga');

            for (let i = 0; i < 10; i++) {
                const availableApartments = testApartments.filter(apt => apt.isAvailableForDraw());
                if (availableApartments.length === 0) break;

                const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
                if (result.success) {
                    const apartment = result.apartment;

                    if (apartment.dupla) {
                        // Apartamento duplo deve receber par
                        expect(result.spotData.type).toBe('double');

                        // Nenhuma vaga do par deve ser estendida
                        expect(isVagaEstendida(result.spotData.pair.aId)).toBe(false);
                        expect(isVagaEstendida(result.spotData.pair.bId)).toBe(false);

                    } else if (apartment.isExtended(isVagaEstendida)) {
                        // Apartamento estendido deve receber vaga estendida
                        expect(result.spotData.type).toBe('single');
                        expect(isVagaEstendida(result.spotData.spot.id)).toBe(true);

                    } else {
                        // Apartamento simples deve receber vaga normal
                        expect(result.spotData.type).toBe('single');
                        expect(isVagaEstendida(result.spotData.spot.id)).toBe(false);
                    }

                    console.log(`✅ Apartamento ${apartment.id} (${apartment.dupla ? 'duplo' : apartment.isExtended(isVagaEstendida) ? 'estendido' : 'simples'}) recebeu tipo correto`);
                }
            }
        });
    });

    describe('8️⃣ CRITÉRIO 8: Fim do sorteio', () => {
        test('Distribuição final correta por tipo', () => {
            console.log('🧪 Testando: Distribuição final conforme tipos');

            const resultados = [];

            // Sortear todos os apartamentos possíveis
            while (true) {
                const availableApartments = testApartments.filter(apt => apt.isAvailableForDraw());
                if (availableApartments.length === 0) break;

                const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
                if (!result.success) break;

                resultados.push({
                    apartmentId: result.apartment.id,
                    tipo: result.apartment.dupla ? 'duplo' :
                        result.apartment.isExtended(isVagaEstendida) ? 'estendido' : 'simples',
                    vagas: result.spotData.type === 'double'
                        ? [result.spotData.pair.aId, result.spotData.pair.bId]
                        : [result.spotData.spot.id]
                });
            }

            // Validar distribuição
            for (const resultado of resultados) {
                switch (resultado.tipo) {
                    case 'simples':
                        expect(resultado.vagas.length).toBe(1);
                        expect(isVagaEstendida(resultado.vagas[0])).toBe(false);
                        break;
                    case 'duplo':
                        expect(resultado.vagas.length).toBe(2);
                        expect(isVagaEstendida(resultado.vagas[0])).toBe(false);
                        expect(isVagaEstendida(resultado.vagas[1])).toBe(false);
                        break;
                    case 'estendido':
                        expect(resultado.vagas.length).toBe(1);
                        expect(isVagaEstendida(resultado.vagas[0])).toBe(true);
                        break;
                }
            }

            console.log(`✅ ${resultados.length} apartamentos sorteados com distribuição correta`);
            console.log('📋 Resumo:', resultados.map(r => `${r.apartmentId}(${r.tipo})`).join(', '));
        });
    });

    describe('9️⃣ CRITÉRIO 9: Aleatoriedade', () => {
        test('Resultados variam em 10 execuções', () => {
            console.log('🧪 Testando: Variação em múltiplas execuções completas');

            const execuções = [];

            for (let exec = 0; exec < 10; exec++) {
                const freshApartments = createTestApartments();
                const freshGarage = createTestGarage();
                const freshSystem = LotterySystemFactory.createSystem({
                    seed: Date.now() + exec * 1337,
                    isExtendedSpotFn: isVagaEstendida
                });

                const resultadosExecucao = [];

                // Sortear até acabar
                while (true) {
                    const available = freshApartments.filter(apt => apt.isAvailableForDraw());
                    if (available.length === 0) break;

                    const result = freshSystem.orchestrator.executeSorting(freshApartments, freshGarage);
                    if (!result.success) break;

                    resultadosExecucao.push({
                        apt: result.apartment.id,
                        vagas: result.spotData.type === 'double'
                            ? `${result.spotData.pair.aId}-${result.spotData.pair.bId}`
                            : result.spotData.spot.id.toString()
                    });
                }

                execuções.push(resultadosExecucao);
            }

            // Verificar variação na ordem dos apartamentos
            const primeirosApartamentos = new Set(execuções.map(e => e[0]?.apt).filter(Boolean));
            const primeiraVagas = new Set(execuções.map(e => e[0]?.vagas).filter(Boolean));

            console.log(`📊 Primeiros apartamentos sorteados: ${[...primeirosApartamentos]}`);
            console.log(`📊 Primeiras vagas sorteadas: ${[...primeiraVagas]}`);

            expect(primeirosApartamentos.size).toBeGreaterThanOrEqual(3);
            expect(primeiraVagas.size).toBeGreaterThanOrEqual(3);

            console.log(`✅ Aleatoriedade confirmada: ${primeirosApartamentos.size} apartamentos e ${primeiraVagas.size} vagas diferentes como primeiros`);
        });
    });

    describe('🏆 CRITÉRIO 10: Integridade visual e sincronização', () => {
        test('Estado interno mantém consistência', () => {
            console.log('🧪 Testando: Consistência do estado interno');

            const estadoInicial = {
                spotsLivres: testGarage.spots.filter(s => !s.occupiedBy).length,
                apartamentosDisponiveis: testApartments.filter(apt => apt.isAvailableForDraw()).length
            };

            const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
            expect(result.success).toBe(true);

            const estadoFinal = {
                spotsLivres: testGarage.spots.filter(s => !s.occupiedBy).length,
                apartamentosDisponiveis: testApartments.filter(apt => apt.isAvailableForDraw()).length
            };

            const vagasUsadas = result.spotData.type === 'double' ? 2 : 1;

            expect(estadoFinal.spotsLivres).toBe(estadoInicial.spotsLivres - vagasUsadas);
            expect(estadoFinal.apartamentosDisponiveis).toBe(estadoInicial.apartamentosDisponiveis - 1);

            console.log(`✅ Estado interno consistente: ${vagasUsadas} vaga(s) ocupada(s), 1 apartamento sorteado`);
        });

        test('Apartamento e vaga sincronizados', () => {
            console.log('🧪 Testando: Sincronização apartamento-vaga');

            const result = lotterySystem.orchestrator.executeSorting(testApartments, testGarage);
            expect(result.success).toBe(true);

            const vagasAtribuidas = result.spotData.type === 'double'
                ? [result.spotData.pair.aId, result.spotData.pair.bId]
                : [result.spotData.spot.id];

            // Verificar se todas as vagas atribuídas estão marcadas com o apartamento correto
            for (const vagaId of vagasAtribuidas) {
                const spot = testGarage.spots.find(s => s.id === vagaId);
                expect(spot.occupiedBy).toBe(result.apartment.id);
            }

            // Verificar se o apartamento tem as vagas corretas registradas
            expect(result.apartment.vagas).toEqual(expect.arrayContaining(vagasAtribuidas));

            console.log(`✅ Apartamento ${result.apartment.id} e vagas ${vagasAtribuidas.join(', ')} perfeitamente sincronizados`);
        });
    });
});