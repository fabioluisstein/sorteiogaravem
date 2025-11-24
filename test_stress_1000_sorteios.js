/**
 * @fileoverview Script de Teste de Stress - 1000 Sorteios Reais
 * @description Executa 1000 sorteios usando o código real do projeto
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

// Configurações do teste
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

async function inicializar() {
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
}

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
                    erros.push(`Sorteio ${index + 1}: Apartamento duplo ${apartment.id} usou vaga estendida ${vagaId}`);
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

async function executarTesteDe1000Sorteios() {
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

            // Parar no primeiro erro para análise
            break;
        }
    }

    console.log(`\n🎯 RELATÓRIO FINAL:`);
    console.log(`✅ Sorteios bem-sucedidos: ${sorteiosComSucesso}/${TOTAL_EXECUCOES}`);

    if (totalErros.length === 0) {
        console.log(`🏆 TODOS OS ${TOTAL_EXECUCOES} SORTEIOS FORAM BEM-SUCEDIDOS E RESPEITARAM TODAS AS REGRAS!`);
        return true;
    } else {
        console.log(`❌ Falhas encontradas: ${totalErros.length}`);
        totalErros.slice(0, 5).forEach(({ execucao, erros }) => {
            console.log(`   Execução ${execucao}:`);
            erros.forEach(erro => console.log(`     - ${erro}`));
        });
        return false;
    }
}

// Função principal
async function main() {
    try {
        await inicializar();

        console.log('🔍 Validando configuração...');

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

        console.log('✅ Configuração válida para testes');

        // Executar o teste principal
        const sucesso = await executarTesteDe1000Sorteios();

        if (sucesso) {
            console.log('\n🎉 TESTE DE STRESS PASSOU! Sistema está funcionando corretamente.');
            process.exit(0);
        } else {
            console.log('\n💥 TESTE DE STRESS FALHOU! Verifique os erros acima.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Erro durante inicialização:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}