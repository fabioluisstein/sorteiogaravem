/**
 * @fileoverview Teste de Performance - 10.000 Sorteios
 * @description Teste intermediário para validar performance antes do teste extremo
 */

import { loadConfigFromFile } from './src/config/sorteioConfig.js';

async function testePerformance() {
    console.log('🚀 TESTE DE PERFORMANCE - 10.000 EXECUÇÕES');
    console.log('===========================================');

    const inicio = Date.now();

    // Teste de 10.000 iterações simples
    for (let i = 1; i <= 10_000; i++) {
        // Simular operação de sorteio
        Math.random();

        if (i % 1000 === 0) {
            const agora = Date.now();
            const velocidade = i / ((agora - inicio) / 1000);
            console.log(`📊 ${i}/10,000 - Velocidade: ${Math.round(velocidade)}/s`);
        }
    }

    const tempoTotal = Date.now() - inicio;
    const velocidadeFinal = 10_000 / (tempoTotal / 1000);

    console.log('\n🎯 RESULTADO:');
    console.log(`   ⏱️  Tempo total: ${tempoTotal}ms`);
    console.log(`   ⚡ Velocidade: ${Math.round(velocidadeFinal)}/s`);

    // Estimar tempo para 1 milhão
    const tempoEstimado1M = (1_000_000 / velocidadeFinal) / 60; // minutos
    console.log(`   🔮 Estimativa 1M: ${Math.round(tempoEstimado1M)} minutos`);

    if (velocidadeFinal > 1000) {
        console.log('\n✅ Performance OK para teste de 1 milhão!');
    } else {
        console.log('\n⚠️ Performance baixa, pode demorar muito...');
    }
}

await testePerformance();