// DELETED: Legacy stress demo test removed per user request. The repository is versioned if recovery is needed.

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

async function executarTesteDeDemonstracao() {
    console.log(`\n🚀 Iniciando ${TOTAL_EXECUCOES} execuções de sorteio completo...\n`);

    let sorteiosComSucesso = 0;
    let totalErros = [];

    for (let execucao = 1; execucao <= TOTAL_EXECUCOES; execucao++) {
        console.log(`\n📋 Execução ${execucao}/${TOTAL_EXECUCOES}:`);

        const garage = criarGaragem();
        const apartments = criarApartamentos();

        console.log(`   • Garage criada com ${garage.spots.length} vagas`);
        console.log(`   • ${apartments.length} apartamentos criados`);

        const resultadoCompleto = lotterySystem.executeMultipleSortings(apartments, garage);
        const resultadosComSucesso = resultadoCompleto.results.filter(r => r.success);

        console.log(`   • ${resultadosComSucesso.length} sorteios executados com sucesso`);

        const errosDaExecucao = validarSorteioCompleto(resultadosComSucesso);

        if (errosDaExecucao.length === 0) {
            sorteiosComSucesso++;
            console.log(`   ✅ Execução ${execucao}: TODAS AS REGRAS RESPEITADAS`);

            // Mostrar estatísticas da execução
            let duplos = 0, estendidos = 0, simples = 0;
            resultadosComSucesso.forEach(r => {
                if (r.apartment.dupla) duplos++;
                else if (sorteioConfig.apartamentosVagasEstendidas.includes(r.apartment.id)) estendidos++;
                else simples++;
            });
            console.log(`     📊 Duplos: ${duplos}, Estendidos: ${estendidos}, Simples: ${simples}`);

        } else {
            console.error(`   ❌ Execução ${execucao} falhou:`);
            errosDaExecucao.forEach(erro => console.error(`     - ${erro}`));

            totalErros.push({
                execucao,
                erros: errosDaExecucao
            });

            // Continuar para ver todos os problemas
        }
    }

    console.log(`\n🎯 RELATÓRIO FINAL:`);
    console.log(`✅ Sorteios bem-sucedidos: ${sorteiosComSucesso}/${TOTAL_EXECUCOES}`);

    if (totalErros.length === 0) {
        console.log(`🏆 TODOS OS ${TOTAL_EXECUCOES} SORTEIOS FORAM BEM-SUCEDIDOS E RESPEITARAM TODAS AS REGRAS!`);
        return true;
    } else {
        console.log(`❌ Falhas encontradas: ${totalErros.length}`);
        totalErros.forEach(({ execucao, erros }) => {
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
        const sucesso = await executarTesteDeDemonstracao();

        if (sucesso) {
            console.log('\n🎉 DEMONSTRAÇÃO PASSOU! Sistema está funcionando corretamente.');
            console.log('   💡 Para executar 1000 sorteios, use: npm run test:stress-real');
            process.exit(0);
        } else {
            console.log('\n💥 DEMONSTRAÇÃO FALHOU! Verifique os erros acima.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Erro durante inicialização:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}