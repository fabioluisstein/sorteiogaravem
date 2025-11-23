/**
 * 🔬 TESTE ESPECÍFICO - Carregamento de Vagas Estendidas
 * Este teste verifica se o loadFromFile está REALMENTE aplicando 
 * as vagas estendidas do arquivo properties
 */

import { ConfigReader, sorteioConfig } from '../src/config/sorteioConfig.js';

console.log('\n🔬 TESTE ESPECÍFICO - Carregamento de Vagas Estendidas');
console.log('=======================================================\n');

// Teste 1: Estado inicial (defaults)
console.log('📊 ESTADO INICIAL (defaults):');
console.log('   Apartamentos estendidos:', sorteioConfig.apartamentosVagasEstendidas);
console.log('   Vagas estendidas:', sorteioConfig.vagasEstendidas);
console.log('   isVagaEstendida(7):', sorteioConfig.isVagaEstendida(7));
console.log('   isVagaEstendida(23):', sorteioConfig.isVagaEstendida(23));

// Teste 2: Carregar arquivo com vagas diferentes
console.log('\n🧪 TESTE: Carregando configuração customizada...');

const configCustomizada = `
# Teste customizado
vagas_estendidas=10,20,30
apartamentos_vagas_estendidas=101,201,301
`;

console.log('📄 Configuração a ser carregada:');
console.log(configCustomizada);

// Aplicar configuração customizada
console.log('\n⚙️ Aplicando configuração...');
await sorteioConfig.loadFromFile(configCustomizada);

console.log('\n📊 ESTADO APÓS CARREGAMENTO:');
console.log('   Apartamentos estendidos:', sorteioConfig.apartamentosVagasEstendidas);
console.log('   Vagas estendidas:', sorteioConfig.vagasEstendidas);
console.log('   isVagaEstendida(7):', sorteioConfig.isVagaEstendida(7), '(deveria ser false)');
console.log('   isVagaEstendida(10):', sorteioConfig.isVagaEstendida(10), '(deveria ser true)');
console.log('   isVagaEstendida(20):', sorteioConfig.isVagaEstendida(20), '(deveria ser true)');
console.log('   isVagaEstendida(30):', sorteioConfig.isVagaEstendida(30), '(deveria ser true)');

// Teste 3: Tentar carregar o arquivo real do projeto
console.log('\n🔍 TESTE: Tentando carregar arquivo real...');

try {
    const fs = await import('fs');
    const path = await import('path');

    const arquivoReal = fs.readFileSync('config/sorteio.properties', 'utf-8');
    console.log('📄 Arquivo real encontrado, tamanho:', arquivoReal.length);

    // Extrair linha das vagas estendidas
    const linhas = arquivoReal.split('\n');
    const linhaVagas = linhas.find(l => l.startsWith('vagas_estendidas='));
    console.log('📋 Linha das vagas estendidas:', linhaVagas);

    // Aplicar arquivo real
    await sorteioConfig.loadFromFile(arquivoReal);

    console.log('\n📊 ESTADO APÓS ARQUIVO REAL:');
    console.log('   Vagas estendidas:', sorteioConfig.vagasEstendidas);
    console.log('   Apartamentos estendidos:', sorteioConfig.apartamentosVagasEstendidas);

    // Verificar vagas específicas do arquivo
    const vagasDoArquivo = [7, 8, 21, 22, 35, 36];
    const vagasProblematicas = [23, 29, 31];

    console.log('\n🎯 VERIFICAÇÃO DAS VAGAS DO ARQUIVO:');
    vagasDoArquivo.forEach(vaga => {
        const ehEstendida = sorteioConfig.isVagaEstendida(vaga);
        console.log(`   Vaga ${vaga}: ${ehEstendida ? '✅ Estendida' : '❌ Normal'}`);
    });

    console.log('\n🚨 VERIFICAÇÃO DAS VAGAS PROBLEMÁTICAS:');
    vagasProblematicas.forEach(vaga => {
        const ehEstendida = sorteioConfig.isVagaEstendida(vaga);
        console.log(`   Vaga ${vaga}: ${ehEstendida ? '🚨 Estendida (ERRO!)' : '✅ Normal'}`);
    });

} catch (error) {
    console.log('❌ Erro ao carregar arquivo real:', error.message);
}

console.log('\n✨ TESTE CONCLUÍDO!\n');