/**
 * @fileoverview Teste Básico do Sistema
 */

import { loadConfigFromFile, sorteioConfig } from './src/config/sorteioConfig.js';

async function main() {
    console.log('🔄 Iniciando teste básico...');

    try {
        await loadConfigFromFile();
        console.log('✅ Configuração carregada com sucesso');
        console.log('📋 Vagas estendidas:', sorteioConfig.vagasEstendidas);
        console.log('📋 Apartamentos duplos:', sorteioConfig.apartamentosVagasDuplas);
        console.log('📋 Apartamentos estendidos:', sorteioConfig.apartamentosVagasEstendidas);

        console.log('\n🎉 Teste básico concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    }
}

main();