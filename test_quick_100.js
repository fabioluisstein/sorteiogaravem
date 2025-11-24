/**
 * @fileoverview Teste Rápido de Validação - 100 Sorteios Reais
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

const TOTAL_EXECUCOES = 100;

async function testeRapido() {
    console.log('🚀 TESTE RÁPIDO - 100 SORTEIOS REAIS');
    console.log('===================================');

    await loadConfigFromFile();

    const apartmentSelector = new ApartmentSelectionService();
    const typeDetector = new ApartmentTypeService();
    const spotSelector = new SpotSelectionService();
    const spotAssigner = new SpotAssignmentService();

    const lotterySystem = new LotteryOrchestrator(
        apartmentSelector, typeDetector, spotSelector, spotAssigner
    );

    function criarGaragem() {
        const garage = new Garage();
        for (let i = 1; i <= 42; i++) {
            const isExtended = sorteioConfig.vagasEstendidas.includes(i);
            garage.addSpot(new Spot({
                id: i,
                andar: `G${Math.ceil(i / 14)}`,
                setor: String.fromCharCode(65 + Math.floor((i - 1) / 7)),
                posicao: ((i - 1) % 7) + 1,
                estendida: isExtended
            }));
        }
        return garage;
    }

    function criarApartamentos() {
        const apartments = [];

        sorteioConfig.apartamentosVagasDuplas.forEach(id => {
            apartments.push(new Apartment(id, id.toString(), true, true));
        });

        sorteioConfig.apartamentosVagasEstendidas.forEach(id => {
            apartments.push(new Apartment(id, id.toString(), true, false));
        });

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

    const inicio = Date.now();
    let sucessos = 0;

    for (let i = 1; i <= TOTAL_EXECUCOES; i++) {
        const garage = criarGaragem();
        const apartments = criarApartamentos();

        const resultado = lotterySystem.executeMultipleSortings(apartments, garage);

        if (resultado.allApartmentsSorted && resultado.results.every(r => r.success)) {
            sucessos++;
        }

        if (i % 10 === 0) {
            const velocidade = i / ((Date.now() - inicio) / 1000);
            console.log(`📊 ${i}/${TOTAL_EXECUCOES} - ${sucessos} sucessos - ${Math.round(velocidade)}/s`);
        }
    }

    const tempoTotal = Date.now() - inicio;
    const velocidadeFinal = TOTAL_EXECUCOES / (tempoTotal / 1000);

    console.log('\n🎯 RESULTADO:');
    console.log(`   ✅ Sucessos: ${sucessos}/${TOTAL_EXECUCOES}`);
    console.log(`   ⏱️  Tempo: ${tempoTotal}ms`);
    console.log(`   ⚡ Velocidade real: ${Math.round(velocidadeFinal)}/s`);

    const tempoEstimado1M = (1_000_000 / velocidadeFinal) / 60;
    console.log(`   🔮 Estimativa 1M sorteios: ${Math.round(tempoEstimado1M)} minutos`);

    if (sucessos === TOTAL_EXECUCOES) {
        console.log('\n🏆 SISTEMA FUNCIONANDO PERFEITAMENTE!');
        console.log('🚀 Pronto para teste de 1 milhão!');
        return true;
    } else {
        console.log('\n❌ Problemas detectados no sistema!');
        return false;
    }
}

await testeRapido();