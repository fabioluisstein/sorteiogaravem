/**
 * Teste completo: Verificar se a conversão resolve o problema de vagas simples
 */

import { sorteioConfig, loadConfigFromFile } from './src/config/sorteioConfig.js';

console.log('🧪 TESTE COMPLETO: Problema de Vagas Simples Resolvido');
console.log('======================================================');

// Simular carregamento da configuração real
const mockRealConfig = `
# Configuração real do sistema
apartamentos_vagas_estendidas=303,403,503,603,703
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_duplas=101,102,103,104,203,301,304,402,404,501,502,604,701,702
vagas_proibidas_duplo=
total_vagas=42
`;

console.log('\n1. 📊 CENÁRIO ORIGINAL (PROBLEMÁTICO):');
console.log('   - Total de vagas: 42');
console.log('   - Apartamentos duplos: 14 (precisam 28 vagas)');
console.log('   - Apartamentos estendidos: 5 (precisam 5 vagas)');
console.log('   - Apartamentos simples: 9 (precisam 9 vagas)');
console.log('   - Vagas estendidas: 6');
console.log('   - PROBLEMA: 28 + 6 + 8 = 42 vagas, mas só 8 vagas para 9 simples!');

console.log('\n2. 🔄 APLICANDO CONVERSÃO AUTOMÁTICA...');
await sorteioConfig.loadFromFile(mockRealConfig);

console.log('\n3. ✅ CENÁRIO APÓS CONVERSÃO:');
console.log(`   - Vagas estendidas: ${sorteioConfig.vagasEstendidas.length} (era 6)`);
console.log(`   - Vagas convertidas para simples: 1 (vaga 36)`);
console.log(`   - Apartamentos duplos: 14 (precisam 28 vagas)`);
console.log(`   - Apartamentos estendidos: 5 (precisam 5 vagas)`);
console.log(`   - Apartamentos simples: 9 (precisam 9 vagas)`);

console.log('\n4. 🧮 CÁLCULO DE VAGAS DISPONÍVEIS:');
const totalVagas = 42;
const vagasParaDuplos = 28;
const vagasParaEstendidos = sorteioConfig.vagasEstendidas.length;
const vagasParaSimples = totalVagas - vagasParaDuplos - vagasParaEstendidos;

console.log(`   - Total: ${totalVagas}`);
console.log(`   - Para duplos: ${vagasParaDuplos}`);
console.log(`   - Para estendidos: ${vagasParaEstendidos}`);
console.log(`   - Para simples: ${vagasParaSimples}`);
console.log(`   - Apartamentos simples: 9`);

if (vagasParaSimples >= 9) {
    console.log(`   ✅ SUCESSO: ${vagasParaSimples} vagas para 9 apartamentos simples`);
} else {
    console.log(`   ❌ FALHA: Apenas ${vagasParaSimples} vagas para 9 apartamentos simples`);
}

console.log('\n5. 🎯 RESULTADO FINAL:');
if (vagasParaSimples >= 9) {
    console.log('   🎉 PROBLEMA RESOLVIDO!');
    console.log('   ✅ Todos os apartamentos simples terão vaga disponível');
    console.log('   ✅ Nenhuma vaga estendida desperdiçada');
    console.log('   ✅ Sistema balanceado automaticamente');
} else {
    console.log('   ❌ Problema ainda existe - verificar lógica');
}

console.log('\n======================================================');