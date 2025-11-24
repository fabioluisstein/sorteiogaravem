/**
 * @fileoverview Script de Teste de Stress EXTREMO - 1 MILHÃO DE SORTEIOS
 * @description Executa 1 MILHÃO de sorteios usando o código real do projeto
 * @performance Otimizado para alta performance e relatórios de progresso
 */

import { LotteryOrchestrator } from './src/core/services/LotteryOrchestrator.js';
import { ApartmentSelectionService } from './src/core/services/ApartmentSelectionService.js';
import { ApartmentTypeService } from './src/core/services/ApartmentTypeService.js';
import { SpotSelectionService } from './src/core/services/SpotSelectionService.js';
import { SpotAssignmentService } from './src/core/services/SpotAssignmentService.js';
import { Garage } from './src/core/models/Garage.js';
import { Apartment } from './src/core/models/Apartment.js';
import { Spot } from './src/core/models/Spot.js';
import { loadConfigFromFile, sorteioConfig } from './src/config/sorteioConfig.js';

// 🚀 CONFIGURAÇÃO EXTREMA - 1 MILHÃO DE SORTEIOS
const TOTAL_EXECUCOES = 1_000_000; // 1 milhão
const TOTAL_VAGAS = 42;
const RELATORIO_A_CADA = 10_000; // Relatório a cada 10.000 execuções
const CHECKPOINT_A_CADA = 100_000; // Checkpoint detalhado a cada 100.000

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

// Cache para otimização
let apartamentosCache = null;
let garagemTemplate = null;

async function inicializar() {
    console.log('🚀 TESTE DE STRESS EXTREMO - 1 MILHÃO DE SORTEIOS');
    console.log('================================================================');
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
    apartamentosSimples = 28 - apartamentosDuplos - apartamentosEstendidos;
    totalApartamentos = apartamentosDuplos + apartamentosEstendidos + apartamentosSimples;

    console.log('📊 Distribuição esperada:');
    console.log(`   Duplos: ${apartamentosDuplos} (${apartamentosDuplos * 2} vagas)`);
    console.log(`   Estendidos: ${apartamentosEstendidos} (${apartamentosEstendidos} vagas)`);
    console.log(`   Simples: ${apartamentosSimples} (${apartamentosSimples} vagas)`);
    console.log(`   Total: ${totalApartamentos} apartamentos → ${TOTAL_VAGAS} vagas`);

    // 🚀 OTIMIZAÇÃO: Pré-criar cache de apartamentos e garagem
    console.log('\n⚡ Otimizando performance...');
    apartamentosCache = criarApartamentos();
    garagemTemplate = criarGaragemTemplate();
    console.log('✅ Cache de objetos criado para máxima performance');
}

function criarGaragemTemplate() {
    // Criar template da garagem que será clonado rapidamente
    const spots = [];
    for (let i = 1; i <= TOTAL_VAGAS; i++) {
        const isExtended = sorteioConfig.vagasEstendidas.includes(i);
        spots.push({
            id: i,
            andar: `G${Math.ceil(i / 14)}`,
            setor: String.fromCharCode(65 + Math.floor((i - 1) / 7)),
            posicao: ((i - 1) % 7) + 1,
            estendida: isExtended
        });
    }
    return spots;
}

function criarGaragem() {
    const garage = new Garage();

    // Usar template pré-criado para máxima velocidade
    garagemTemplate.forEach(spotData => {
        garage.addSpot(new Spot(spotData));
    });

    return garage;
}

function criarApartamentos() {
    const apartments = [];

    // Apartamentos duplos
    sorteioConfig.apartamentosVagasDuplas.forEach(id => {
        apartments.push(new Apartment(id, id.toString(), true, true));
    });

    // Apartamentos estendidos
    sorteioConfig.apartamentosVagasEstendidas.forEach(id => {
        apartments.push(new Apartment(id, id.toString(), true, false));
    });

    // Apartamentos simples
    const todosIds = Array.from({ length: 28 }, (_, i) => {
        const andar = Math.floor(i / 4) + 1;
        const numero = (i % 4) + 1;
        return parseInt(`${andar}0${numero}`);
    });

    todosIds.forEach(id => {
        if (!sorteioConfig.apartamentosVagasDuplas.includes(id) &&
            !sorteioConfig.apartamentosVagasEstendidas.includes(id)) {
            apartments.push(new Apartment(id, id.toString(), true, false));
        }
    });

    return apartments;
}

function clonarApartamentos() {
    // Clone rápido dos apartamentos para cada iteração
    return apartamentosCache.map(apt =>
        new Apartment(apt.id, apt.apartmentNumber, apt.ativo, apt.dupla)
    );
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
        const isEstendido = sorteioConfig.apartamentosVagasEstendidas.includes(apartment.id);

        if (isDuplo) {
            contadorDuplos++;

            if (vagas.length !== 2) {
                erros.push(`Sorteio ${index + 1}: Apartamento duplo ${apartment.id} recebeu ${vagas.length} vaga(s)`);
            }

            if (!validarPairDuplo(vagas)) {
                erros.push(`Sorteio ${index + 1}: Par inválido para apartamento duplo ${apartment.id}: [${vagas.join(', ')}]`);
            }

            vagas.forEach(vagaId => {
                if (sorteioConfig.vagasEstendidas.includes(vagaId)) {
                    erros.push(`Sorteio ${index + 1}: ⚠️ CRÍTICO: Apartamento duplo ${apartment.id} usou vaga estendida ${vagaId}`);
                }
            });

        } else if (isEstendido) {
            contadorEstendidos++;

            if (vagas.length !== 1) {
                erros.push(`Sorteio ${index + 1}: Apartamento estendido ${apartment.id} recebeu ${vagas.length} vaga(s)`);
            }

            const vagaId = vagas[0];
            if (!sorteioConfig.vagasEstendidas.includes(vagaId)) {
                erros.push(`Sorteio ${index + 1}: Apartamento estendido ${apartment.id} recebeu vaga não-estendida ${vagaId}`);
            }

        } else {
            contadorSimples++;

            if (vagas.length !== 1) {
                erros.push(`Sorteio ${index + 1}: Apartamento simples ${apartment.id} recebeu ${vagas.length} vaga(s)`);
            }

            const vagaId = vagas[0];
            if (sorteioConfig.vagasEstendidas.includes(vagaId)) {
                erros.push(`Sorteio ${index + 1}: 🚨 CRÍTICO: Apartamento simples ${apartment.id} recebeu vaga estendida ${vagaId}`);
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

function formatarTempo(milisegundos) {
    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);

    if (horas > 0) {
        return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
    } else if (minutos > 0) {
        return `${minutos}m ${segundos % 60}s`;
    } else {
        return `${segundos}s`;
    }
}

function calcularETA(execucaoAtual, tempoDecorrido) {
    const velocidade = execucaoAtual / tempoDecorrido; // execuções por ms
    const restantes = TOTAL_EXECUCOES - execucaoAtual;
    const etaMs = restantes / velocidade;
    return formatarTempo(etaMs);
}

async function executarTesteDe1MilhaoSorteios() {
    console.log('\n🚀 INICIANDO 1 MILHÃO DE EXECUÇÕES DE SORTEIO COMPLETO');
    console.log('================================================================');
    console.log(`📊 Configuração:
    • Total de execuções: ${TOTAL_EXECUCOES.toLocaleString()}
    • Relatório a cada: ${RELATORIO_A_CADA.toLocaleString()} execuções
    • Checkpoint detalhado: ${CHECKPOINT_A_CADA.toLocaleString()} execuções
    • Memória otimizada: ✅
    • Cache ativo: ✅\n`);

    let sorteiosComSucesso = 0;
    let totalErros = [];
    let estatisticas = {
        tempoInicio: Date.now(),
        ultimoRelatorio: Date.now(),
        velocidadeMedia: 0,
        velocidadeAtual: 0
    };

    for (let execucao = 1; execucao <= TOTAL_EXECUCOES; execucao++) {
        // ⚡ Usar cache otimizado
        const garage = criarGaragem();
        const apartments = clonarApartamentos();

        const resultadoCompleto = lotterySystem.executeMultipleSortings(apartments, garage);
        const resultadosComSucesso = resultadoCompleto.results.filter(r => r.success);

        const errosDaExecucao = validarSorteioCompleto(resultadosComSucesso);

        if (errosDaExecucao.length === 0) {
            sorteiosComSucesso++;
        } else {
            console.error(`\n🚨 EXECUÇÃO ${execucao} FALHOU:`);
            errosDaExecucao.forEach(erro => console.error(`   ❌ ${erro}`));

            totalErros.push({
                execucao,
                erros: errosDaExecucao
            });

            // Parar no primeiro erro para análise
            console.log(`\n💥 TESTE INTERROMPIDO NA EXECUÇÃO ${execucao}`);
            break;
        }

        // 📊 RELATÓRIOS DE PROGRESSO
        if (execucao % RELATORIO_A_CADA === 0 || execucao === TOTAL_EXECUCOES) {
            const agora = Date.now();
            const tempoDecorrido = agora - estatisticas.tempoInicio;
            const tempoSegmento = agora - estatisticas.ultimoRelatorio;

            estatisticas.velocidadeMedia = execucao / (tempoDecorrido / 1000);
            estatisticas.velocidadeAtual = RELATORIO_A_CADA / (tempoSegmento / 1000);

            const progresso = (execucao / TOTAL_EXECUCOES * 100).toFixed(2);
            const eta = execucao < TOTAL_EXECUCOES ? calcularETA(execucao, tempoDecorrido) : '00s';

            console.log(`\n📈 PROGRESSO: ${progresso}% (${execucao.toLocaleString()}/${TOTAL_EXECUCOES.toLocaleString()})`);
            console.log(`   ⚡ Velocidade atual: ${Math.round(estatisticas.velocidadeAtual)}/s`);
            console.log(`   📊 Velocidade média: ${Math.round(estatisticas.velocidadeMedia)}/s`);
            console.log(`   ⏱️  Tempo decorrido: ${formatarTempo(tempoDecorrido)}`);
            console.log(`   🎯 ETA: ${eta}`);
            console.log(`   ✅ Sucessos: ${sorteiosComSucesso.toLocaleString()}`);

            estatisticas.ultimoRelatorio = agora;
        }

        // 📋 CHECKPOINT DETALHADO
        if (execucao % CHECKPOINT_A_CADA === 0) {
            const memUsage = process.memoryUsage();
            console.log(`\n🏁 CHECKPOINT ${(execucao / 1000).toFixed(0)}K:`);
            console.log(`   💾 Memória: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
            console.log(`   🎯 Taxa de sucesso: ${(sorteiosComSucesso / execucao * 100).toFixed(3)}%`);
            console.log(`   🚀 Performance mantida: ${estatisticas.velocidadeAtual > 50 ? '✅' : '⚠️'}`);
        }

        // 🧹 Limpeza de memória ocasional
        if (execucao % 50000 === 0) {
            if (global.gc) {
                global.gc();
            }
        }
    }

    // 🎯 RELATÓRIO FINAL DETALHADO
    console.log('\n================================================================');
    console.log('🏆 RELATÓRIO FINAL DO TESTE DE STRESS EXTREMO');
    console.log('================================================================');

    const tempoTotal = Date.now() - estatisticas.tempoInicio;
    const velocidadeFinal = TOTAL_EXECUCOES / (tempoTotal / 1000);

    console.log(`📊 ESTATÍSTICAS GERAIS:`);
    console.log(`   • Execuções completadas: ${sorteiosComSucesso.toLocaleString()}/${TOTAL_EXECUCOES.toLocaleString()}`);
    console.log(`   • Tempo total: ${formatarTempo(tempoTotal)}`);
    console.log(`   • Velocidade média final: ${Math.round(velocidadeFinal)}/s`);
    console.log(`   • Taxa de sucesso: ${(sorteiosComSucesso / TOTAL_EXECUCOES * 100).toFixed(6)}%`);

    const memFinal = process.memoryUsage();
    console.log(`\n💾 MEMÓRIA:`);
    console.log(`   • Heap usado: ${Math.round(memFinal.heapUsed / 1024 / 1024)}MB`);
    console.log(`   • Heap total: ${Math.round(memFinal.heapTotal / 1024 / 1024)}MB`);

    if (totalErros.length === 0) {
        console.log(`\n🏆🎉 TODOS OS ${TOTAL_EXECUCOES.toLocaleString()} SORTEIOS FORAM BEM-SUCEDIDOS!`);
        console.log(`🚀 SISTEMA VALIDADO PARA PRODUÇÃO COM 1 MILHÃO DE EXECUÇÕES!`);
        console.log(`✅ TODAS AS REGRAS RESPEITADAS SEM EXCEÇÃO!`);
        return true;
    } else {
        console.log(`\n❌ FALHAS ENCONTRADAS: ${totalErros.length}`);
        totalErros.slice(0, 5).forEach(({ execucao, erros }) => {
            console.log(`   🚨 Execução ${execucao}:`);
            erros.forEach(erro => console.log(`     - ${erro}`));
        });
        return false;
    }
}

// Função principal
async function main() {
    try {
        await inicializar();

        console.log('\n🔍 Validando configuração...');

        // Validações de configuração
        if (!sorteioConfig.vagasEstendidas || sorteioConfig.vagasEstendidas.length === 0) {
            throw new Error('Vagas estendidas não definidas');
        }

        if (!sorteioConfig.apartamentosVagasDuplas || sorteioConfig.apartamentosVagasDuplas.length === 0) {
            throw new Error('Apartamentos duplos não definidos');
        }

        if (!sorteioConfig.apartamentosVagasEstendidas || sorteioConfig.apartamentosVagasEstendidas.length === 0) {
            throw new Error('Apartamentos estendidos não definidos');
        }

        const totalVagasNecessarias =
            (apartamentosDuplos * 2) + apartamentosEstendidos + apartamentosSimples;

        if (totalVagasNecessarias !== TOTAL_VAGAS) {
            throw new Error(`Balanceamento inválido: esperado ${TOTAL_VAGAS} vagas, calculado ${totalVagasNecessarias}`);
        }

        console.log('✅ Configuração válida para teste extremo');

        // 🚀 EXECUTAR O TESTE DE 1 MILHÃO
        console.log('\n⚠️  ATENÇÃO: Iniciando teste de stress EXTREMO...');
        console.log('   Este teste pode demorar várias horas dependendo do hardware.');
        console.log('   Recomenda-se acompanhar o progresso pelos relatórios.\n');

        const sucesso = await executarTesteDe1MilhaoSorteios();

        if (sucesso) {
            console.log('\n🎉 TESTE DE STRESS EXTREMO CONCLUÍDO COM SUCESSO!');
            console.log('🏆 Sistema aprovado para produção com máxima confiança!');
            process.exit(0);
        } else {
            console.log('\n💥 TESTE DE STRESS EXTREMO FALHOU!');
            console.log('🔍 Verifique os erros reportados acima.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Erro durante inicialização:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}