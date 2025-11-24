/**
 * @fileoverview Teste de Stress Simplificado - 1000 Sorteios
 * @description Executa 1000 sorteios e valida todas as regras de negócio
 */

// Imports diretos sem path mapping
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para carregar módulos dinamicamente
async function loadProjectModules() {
    const srcPath = path.resolve(__dirname, '../src');

    // Carregar configuração
    const configPath = path.join(srcPath, 'config', 'sorteioConfig.js');
    const { loadConfigFromFile, sorteioConfig } = await import(configPath);

    // Carregar serviços
    const orchestratorPath = path.join(srcPath, 'core', 'services', 'LotteryOrchestrator.js');
    const apartmentSelectorPath = path.join(srcPath, 'core', 'services', 'ApartmentSelectionService.js');
    const typeServicePath = path.join(srcPath, 'core', 'services', 'ApartmentTypeService.js');
    const spotServicePath = path.join(srcPath, 'core', 'services', 'SpotSelectionService.js');
    const assignmentServicePath = path.join(srcPath, 'core', 'services', 'SpotAssignmentService.js');

    // Carregar modelos
    const garagePath = path.join(srcPath, 'core', 'models', 'Garage.js');
    const apartmentPath = path.join(srcPath, 'core', 'models', 'Apartment.js');
    const spotPath = path.join(srcPath, 'core', 'models', 'Spot.js');

    const modules = {
        config: { loadConfigFromFile, sorteioConfig },
        LotteryOrchestrator: (await import(orchestratorPath)).LotteryOrchestrator,
        ApartmentSelectionService: (await import(apartmentSelectorPath)).ApartmentSelectionService,
        ApartmentTypeService: (await import(typeServicePath)).ApartmentTypeService,
        SpotSelectionService: (await import(spotServicePath)).SpotSelectionService,
        SpotAssignmentService: (await import(assignmentServicePath)).SpotAssignmentService,
        Garage: (await import(garagePath)).Garage,
        Apartment: (await import(apartmentPath)).Apartment,
        Spot: (await import(spotPath)).Spot
    };

    return modules;
}

describe('🧪 TESTE DE STRESS - 1000 SORTEIOS AUTOMÁTICOS', () => {
    const TOTAL_EXECUCOES = 1000;
    const TOTAL_VAGAS = 42;
    const PARES_VALIDOS_DUPLOS = [
        [1, 2], [3, 4], [5, 6], [9, 10], [11, 12], [13, 14],
        [15, 16], [17, 18], [19, 20], [23, 24], [25, 26], [27, 28],
        [29, 30], [31, 32], [33, 34], [37, 38], [39, 40], [41, 42]
    ];

    let modules;
    let lotterySystem;
    let totalApartamentos;
    let apartamentosDuplos;
    let apartamentosEstendidos;
    let apartamentosSimples;

    beforeAll(async () => {
        console.log('🔄 Carregando módulos do projeto...');

        // Carregar todos os módulos
        modules = await loadProjectModules();

        // Carregar configuração
        await modules.config.loadConfigFromFile();

        console.log('📋 Configuração carregada:');
        console.log(`   Vagas estendidas: [${modules.config.sorteioConfig.vagasEstendidas.join(', ')}]`);
        console.log(`   Apartamentos duplos: ${modules.config.sorteioConfig.apartamentosVagasDuplas.length}`);
        console.log(`   Apartamentos estendidos: ${modules.config.sorteioConfig.apartamentosVagasEstendidas.length}`);

        // Criar sistema de sorteio
        const apartmentSelector = new modules.ApartmentSelectionService();
        const typeDetector = new modules.ApartmentTypeService();
        const spotSelector = new modules.SpotSelectionService();
        const spotAssigner = new modules.SpotAssignmentService();

        lotterySystem = new modules.LotteryOrchestrator(
            apartmentSelector,
            typeDetector,
            spotSelector,
            spotAssigner
        );

        // Calcular totais esperados
        apartamentosDuplos = modules.config.sorteioConfig.apartamentosVagasDuplas.length;
        apartamentosEstendidos = modules.config.sorteioConfig.apartamentosVagasEstendidas.length;
        apartamentosSimples = 28 - apartamentosDuplos - apartamentosEstendidos;
        totalApartamentos = apartamentosDuplos + apartamentosEstendidos + apartamentosSimples;

        console.log('📊 Distribuição esperada:');
        console.log(`   Duplos: ${apartamentosDuplos} (${apartamentosDuplos * 2} vagas)`);
        console.log(`   Estendidos: ${apartamentosEstendidos} (${apartamentosEstendidos} vagas)`);
        console.log(`   Simples: ${apartamentosSimples} (${apartamentosSimples} vagas)`);
        console.log(`   Total: ${totalApartamentos} apartamentos → ${TOTAL_VAGAS} vagas`);
    }, 30000);

    function criarGaragem() {
        const garage = new modules.Garage();

        // Adicionar todas as 42 vagas
        for (let i = 1; i <= TOTAL_VAGAS; i++) {
            const isExtended = modules.config.sorteioConfig.vagasEstendidas.includes(i);
            const spot = new modules.Spot({
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
        modules.config.sorteioConfig.apartamentosVagasDuplas.forEach(id => {
            apartments.push(new modules.Apartment(id, id.toString(), true, true));
        });

        // Apartamentos estendidos
        modules.config.sorteioConfig.apartamentosVagasEstendidas.forEach(id => {
            apartments.push(new modules.Apartment(id, id.toString(), true, false));
        });

        // Apartamentos simples
        const todosIds = Array.from({ length: 28 }, (_, i) => {
            const andar = Math.floor(i / 4) + 1;
            const numero = (i % 4) + 1;
            return parseInt(`${andar}0${numero}`);
        });

        todosIds.forEach(id => {
            if (!modules.config.sorteioConfig.apartamentosVagasDuplas.includes(id) &&
                !modules.config.sorteioConfig.apartamentosVagasEstendidas.includes(id)) {
                apartments.push(new modules.Apartment(id, id.toString(), true, false));
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

        resultados.forEach((resultado, index) => {
            const { apartment, spotData } = resultado;

            if (!apartment || !spotData) {
                erros.push(`Sorteio ${index + 1}: Dados inválidos`);
                return;
            }

            const vagas = spotData.type === 'double' ?
                [spotData.pair.aId, spotData.pair.bId] :
                [spotData.spot.id];

            // Verificar vagas duplicadas
            vagas.forEach(vagaId => {
                if (vagasUsadas.has(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: Vaga ${vagaId} duplicada`);
                }
                vagasUsadas.add(vagaId);
            });

            // Validar por tipo
            const isDuplo = apartment.dupla;
            const isEstendido = modules.config.sorteioConfig.apartamentosVagasEstendidas.includes(apartment.id);

            if (isDuplo) {
                contadorDuplos++;

                if (vagas.length !== 2) {
                    erros.push(`Sorteio ${index + 1}: Apartamento duplo ${apartment.id} recebeu ${vagas.length} vaga(s)`);
                }

                if (!validarPairDuplo(vagas)) {
                    erros.push(`Sorteio ${index + 1}: Par inválido para apartamento duplo ${apartment.id}: [${vagas.join(', ')}]`);
                }

                vagas.forEach(vagaId => {
                    if (modules.config.sorteioConfig.vagasEstendidas.includes(vagaId)) {
                        erros.push(`Sorteio ${index + 1}: Apartamento duplo ${apartment.id} usou vaga estendida ${vagaId}`);
                    }
                });

            } else if (isEstendido) {
                contadorEstendidos++;

                if (vagas.length !== 1) {
                    erros.push(`Sorteio ${index + 1}: Apartamento estendido ${apartment.id} recebeu ${vagas.length} vaga(s)`);
                }

                const vagaId = vagas[0];
                if (!modules.config.sorteioConfig.vagasEstendidas.includes(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: Apartamento estendido ${apartment.id} recebeu vaga não-estendida ${vagaId}`);
                }

            } else {
                contadorSimples++;

                if (vagas.length !== 1) {
                    erros.push(`Sorteio ${index + 1}: Apartamento simples ${apartment.id} recebeu ${vagas.length} vaga(s)`);
                }

                const vagaId = vagas[0];
                if (modules.config.sorteioConfig.vagasEstendidas.includes(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: Apartamento simples ${apartment.id} recebeu vaga estendida ${vagaId}`);
                }
            }
        });

        // Validar contadores
        if (contadorDuplos !== apartamentosDuplos) {
            erros.push(`Quantidade incorreta de apartamentos duplos: esperado ${apartamentosDuplos}, obtido ${contadorDuplos}`);
        }

        if (contadorEstendidos !== apartamentosEstendidos) {
            erros.push(`Quantidade incorreta de apartamentos estendidos: esperado ${apartamentosEstendidos}, obtido ${contadorEstendidos}`);
        }

        if (contadorSimples !== apartamentosSimples) {
            erros.push(`Quantidade incorreta de apartamentos simples: esperado ${apartamentosSimples}, obtido ${contadorSimples}`);
        }

        if (vagasUsadas.size !== TOTAL_VAGAS) {
            erros.push(`Total de vagas incorreto: esperado ${TOTAL_VAGAS}, obtido ${vagasUsadas.size}`);
        }

        return erros;
    }

    test(`🎯 Executar ${TOTAL_EXECUCOES} sorteios completos`, async () => {
        console.log(`\n🚀 Iniciando ${TOTAL_EXECUCOES} execuções de sorteio completo...\n`);

        let sorteiosComSucesso = 0;
        let totalErros = [];

        for (let execucao = 1; execucao <= TOTAL_EXECUCOES; execucao++) {
            const garage = criarGaragem();
            const apartments = criarApartamentos();

            const resultadoCompleto = lotterySystem.executeMultipleSortings(apartments, garage);
            const resultadosComSucesso = resultadoCompleto.results.filter(r => r.success);

            const errosDaExecucao = validarSorteioCompleto(resultadosComSucesso);

            if (errosDaExecucao.length === 0) {
                sorteiosComSucesso++;

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

                // Falhar imediatamente
                expect(errosDaExecucao).toHaveLength(0);
                break;
            }
        }

        console.log(`\n🎯 RELATÓRIO FINAL:`);
        console.log(`✅ Sorteios bem-sucedidos: ${sorteiosComSucesso}/${TOTAL_EXECUCOES}`);

        if (totalErros.length === 0) {
            console.log(`🏆 TODOS OS ${TOTAL_EXECUCOES} SORTEIOS FORAM BEM-SUCEDIDOS E RESPEITARAM TODAS AS REGRAS!`);
        }

        expect(sorteiosComSucesso).toBe(TOTAL_EXECUCOES);
        expect(totalErros).toHaveLength(0);
    }, 300000);

    test('🔍 Validar configuração antes dos testes', () => {
        expect(modules.config.sorteioConfig.vagasEstendidas).toBeDefined();
        expect(modules.config.sorteioConfig.apartamentosVagasDuplas).toBeDefined();
        expect(modules.config.sorteioConfig.apartamentosVagasEstendidas).toBeDefined();

        const totalVagasNecessarias =
            (apartamentosDuplos * 2) + apartamentosEstendidos + apartamentosSimples;

        expect(totalVagasNecessarias).toBe(TOTAL_VAGAS);

        console.log('✅ Configuração válida para testes');
    });
});