/**
 * @fileoverview Teste de Stress - 1000 Sorteios Automáticos
 * @description Executa 1000 sorteios completos e valida todas as regras obrigatórias
 */

import { LotteryOrchestrator } from '../src/core/services/LotteryOrchestrator.js';
import { ApartmentSelectionService } from '../src/core/services/ApartmentSelectionService.js';
import { ApartmentTypeService } from '../src/core/services/ApartmentTypeService.js';
import { SpotSelectionService } from '../src/core/services/SpotSelectionService.js';
import { SpotAssignmentService } from '../src/core/services/SpotAssignmentService.js';
import { Garage } from '../src/core/models/Garage.js';
import { Apartment } from '../src/core/models/Apartment.js';
import { Spot } from '../src/core/models/Spot.js';
import { loadConfigFromFile, sorteioConfig } from '../src/config/sorteioConfig.js';

describe('🧪 TESTE DE STRESS - 1000 SORTEIOS AUTOMÁTICOS', () => {
    const TOTAL_EXECUCOES = 1000;
    const TOTAL_VAGAS = 42;
    const PARES_VALIDOS_DUPLOS = [
        [1, 2], [3, 4], [5, 6], [9, 10], [11, 12], [13, 14],
        [15, 16], [17, 18], [19, 20], [23, 24], [25, 26], [27, 28],
        [29, 30], [31, 32], [33, 34], [37, 38], [39, 40], [41, 42]
    ];

    let lotterySystem;
    let totalApartamentos;
    let apartamentosDuplos;
    let apartamentosEstendidos;
    let apartamentosSimples;

    beforeAll(async () => {
        console.log('🔄 Carregando configuração...');

        // Carregar configuração real
        await loadConfigFromFile();

        console.log('📋 Configuração carregada:');
        console.log(`   Vagas estendidas: [${sorteioConfig.vagasEstendidas.join(', ')}]`);
        console.log(`   Apartamentos duplos: ${sorteioConfig.apartamentosVagasDuplas.length}`);
        console.log(`   Apartamentos estendidos: ${sorteioConfig.apartamentosVagasEstendidas.length}`);

        // Criar sistema de sorteio
        const apartmentSelector = new ApartmentSelectionService();
        const typeDetector = new ApartmentTypeService();
        const spotSelector = new SpotSelectionService();
        const spotAssigner = new SpotAssignmentService();

        lotterySystem = new LotteryOrchestrator(
            apartmentSelector,
            typeDetector,
            spotSelector,
            spotAssigner
        );

        // Calcular totais esperados
        apartamentosDuplos = sorteioConfig.apartamentosVagasDuplas.length;
        apartamentosEstendidos = sorteioConfig.apartamentosVagasEstendidas.length;
        apartamentosSimples = 28 - apartamentosDuplos - apartamentosEstendidos; // Total 28 apartamentos
        totalApartamentos = apartamentosDuplos + apartamentosEstendidos + apartamentosSimples;

        console.log('📊 Distribuição esperada:');
        console.log(`   Duplos: ${apartamentosDuplos} (${apartamentosDuplos * 2} vagas)`);
        console.log(`   Estendidos: ${apartamentosEstendidos} (${apartamentosEstendidos} vagas)`);
        console.log(`   Simples: ${apartamentosSimples} (${apartamentosSimples} vagas)`);
        console.log(`   Total: ${totalApartamentos} apartamentos → ${TOTAL_VAGAS} vagas`);
    });

    function criarGaragem() {
        const garage = new Garage();

        // Adicionar todas as 42 vagas
        for (let i = 1; i <= TOTAL_VAGAS; i++) {
            const isExtended = sorteioConfig.vagasEstendidas.includes(i);
            const spot = new Spot({
                id: i,
                andar: `G${Math.ceil(i / 14)}`,
                setor: String.fromCharCode(65 + Math.floor((i - 1) / 7)),
                posicao: ((i - 1) % 7) + 1,
                estendida: isExtended
            });
            garage.addSpot(spot);
        }

        return garage;
    }

    function criarApartamentos() {
        const apartments = [];

        // Apartamentos duplos
        sorteioConfig.apartamentosVagasDuplas.forEach(id => {
            apartments.push(new Apartment(id, id.toString(), true, true)); // ativo=true, dupla=true
        });

        // Apartamentos estendidos
        sorteioConfig.apartamentosVagasEstendidas.forEach(id => {
            apartments.push(new Apartment(id, id.toString(), true, false)); // ativo=true, dupla=false
        });

        // Apartamentos simples (todos os outros até 28 total)
        const todosIds = Array.from({ length: 28 }, (_, i) => {
            const andar = Math.floor(i / 4) + 1;
            const numero = (i % 4) + 1;
            return parseInt(`${andar}0${numero}`);
        });

        todosIds.forEach(id => {
            if (!sorteioConfig.apartamentosVagasDuplas.includes(id) &&
                !sorteioConfig.apartamentosVagasEstendidas.includes(id)) {
                apartments.push(new Apartment(id, id.toString(), true, false)); // ativo=true, dupla=false
            }
        });

        return apartments;
    }

    function validarPairDuplo(vagas) {
        if (vagas.length !== 2) return false;

        const [vaga1, vaga2] = vagas.sort((a, b) => a - b);

        return PARES_VALIDOS_DUPLOS.some(([p1, p2]) =>
            p1 === vaga1 && p2 === vaga2
        );
    }

    function validarSorteioCompleto(resultados) {
        const erros = [];
        const vagasUsadas = new Set();

        let contadorDuplos = 0;
        let contadorEstendidos = 0;
        let contadorSimples = 0;

        // Validar cada resultado
        resultados.forEach((resultado, index) => {
            const { apartment, spotData } = resultado;

            if (!apartment || !spotData) {
                erros.push(`Sorteio ${index + 1}: Dados inválidos`);
                return;
            }

            const vagas = spotData.type === 'double' ?
                [spotData.pair.aId, spotData.pair.bId] :
                [spotData.spot.id];

            // Verificar se vagas já foram usadas
            vagas.forEach(vagaId => {
                if (vagasUsadas.has(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: Vaga ${vagaId} duplicada`);
                }
                vagasUsadas.add(vagaId);
            });

            // Validar por tipo de apartamento
            const isDuplo = apartment.dupla; // Use a propriedade do apartamento
            const isEstendido = sorteioConfig.apartamentosVagasEstendidas.includes(apartment.id);

            if (isDuplo) {
                contadorDuplos++;

                // Validar apartamento duplo
                if (vagas.length !== 2) {
                    erros.push(`Sorteio ${index + 1}: Apartamento duplo ${apartment.id} recebeu ${vagas.length} vaga(s)`);
                }

                if (!validarPairDuplo(vagas)) {
                    erros.push(`Sorteio ${index + 1}: Par inválido para apartamento duplo ${apartment.id}: [${vagas.join(', ')}]`);
                }

                // Verificar se não usou vagas estendidas
                vagas.forEach(vagaId => {
                    if (sorteioConfig.vagasEstendidas.includes(vagaId)) {
                        erros.push(`Sorteio ${index + 1}: Apartamento duplo ${apartment.id} usou vaga estendida ${vagaId}`);
                    }
                });

            } else if (isEstendido) {
                contadorEstendidos++;

                // Validar apartamento estendido
                if (vagas.length !== 1) {
                    erros.push(`Sorteio ${index + 1}: Apartamento estendido ${apartment.id} recebeu ${vagas.length} vaga(s)`);
                }

                const vagaId = vagas[0];
                if (!sorteioConfig.vagasEstendidas.includes(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: Apartamento estendido ${apartment.id} recebeu vaga não-estendida ${vagaId}`);
                }

            } else {
                contadorSimples++;

                // Validar apartamento simples
                if (vagas.length !== 1) {
                    erros.push(`Sorteio ${index + 1}: Apartamento simples ${apartment.id} recebeu ${vagas.length} vaga(s)`);
                }

                const vagaId = vagas[0];
                if (sorteioConfig.vagasEstendidas.includes(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: Apartamento simples ${apartment.id} recebeu vaga estendida ${vagaId}`);
                }
            }
        });

        // Validar contadores finais
        if (contadorDuplos !== apartamentosDuplos) {
            erros.push(`Quantidade incorreta de apartamentos duplos: esperado ${apartamentosDuplos}, obtido ${contadorDuplos}`);
        }

        if (contadorEstendidos !== apartamentosEstendidos) {
            erros.push(`Quantidade incorreta de apartamentos estendidos: esperado ${apartamentosEstendidos}, obtido ${contadorEstendidos}`);
        }

        if (contadorSimples !== apartamentosSimples) {
            erros.push(`Quantidade incorreta de apartamentos simples: esperado ${apartamentosSimples}, obtido ${contadorSimples}`);
        }

        // Validar total de vagas
        if (vagasUsadas.size !== TOTAL_VAGAS) {
            erros.push(`Total de vagas incorreto: esperado ${TOTAL_VAGAS}, obtido ${vagasUsadas.size}`);
        }

        // Validar se todas as vagas foram usadas
        for (let i = 1; i <= TOTAL_VAGAS; i++) {
            if (!vagasUsadas.has(i)) {
                erros.push(`Vaga ${i} não foi atribuída`);
            }
        }

        return erros;
    }

    test(`🎯 Executar ${TOTAL_EXECUCOES} sorteios completos`, async () => {
        console.log(`\n🚀 Iniciando ${TOTAL_EXECUCOES} execuções de sorteio completo...\n`);

        let sorteiosComSucesso = 0;
        let totalErros = [];

        for (let execucao = 1; execucao <= TOTAL_EXECUCOES; execucao++) {
            // Criar nova instância para cada execução
            const garage = criarGaragem();
            const apartments = criarApartamentos();

            // Executar sorteio completo
            const resultadoCompleto = lotterySystem.executeMultipleSortings(apartments, garage);

            // Filtrar apenas resultados bem-sucedidos
            const resultadosComSucesso = resultadoCompleto.results.filter(r => r.success);

            // Validar resultado
            const errosDaExecucao = validarSorteioCompleto(resultadosComSucesso);

            if (errosDaExecucao.length === 0) {
                sorteiosComSucesso++;

                // Log a cada 100 execuções
                if (execucao % 100 === 0) {
                    console.log(`✅ ${execucao}/${TOTAL_EXECUCOES} execuções concluídas com sucesso`);
                }
            } else {
                console.error(`❌ Execução ${execucao} falhou:`);
                errosDaExecucao.forEach(erro => console.error(`   - ${erro}`));

                totalErros.push({
                    execucao,
                    erros: errosDaExecucao
                });

                // Falhar imediatamente no primeiro erro
                expect(errosDaExecucao).toHaveLength(0);
            }
        }

        // Relatório final
        console.log(`\n🎯 RELATÓRIO FINAL:`);
        console.log(`✅ Sorteios bem-sucedidos: ${sorteiosComSucesso}/${TOTAL_EXECUCOES}`);

        if (totalErros.length === 0) {
            console.log(`🏆 TODOS OS ${TOTAL_EXECUCOES} SORTEIOS FORAM BEM-SUCEDIDOS E RESPEITARAM TODAS AS REGRAS!`);
        } else {
            console.log(`❌ Falhas encontradas: ${totalErros.length}`);
            totalErros.slice(0, 5).forEach(({ execucao, erros }) => {
                console.log(`   Execução ${execucao}:`);
                erros.forEach(erro => console.log(`     - ${erro}`));
            });
        }

        // Validação final Jest
        expect(sorteiosComSucesso).toBe(TOTAL_EXECUCOES);
        expect(totalErros).toHaveLength(0);
    }, 300000); // Timeout de 5 minutos

    test('🔍 Validar configuração antes dos testes', () => {
        console.log('\n🔍 Validando configuração...');

        // Validar vagas estendidas
        expect(sorteioConfig.vagasEstendidas).toBeDefined();
        expect(sorteioConfig.vagasEstendidas.length).toBeGreaterThan(0);

        // Validar apartamentos
        expect(sorteioConfig.apartamentosVagasDuplas).toBeDefined();
        expect(sorteioConfig.apartamentosVagasEstendidas).toBeDefined();

        // Validar balanceamento
        const totalVagasNecessarias =
            (apartamentosDuplos * 2) + apartamentosEstendidos + apartamentosSimples;

        expect(totalVagasNecessarias).toBe(TOTAL_VAGAS);

        console.log('✅ Configuração válida para testes');
    });
});