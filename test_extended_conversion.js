/**
 * Teste da conversão automática de vagas estendidas excedentes para simples
 */

import { sorteioConfig } from './src/config/sorteioConfig.js';

console.log('🧪 TESTE: Conversão de Vagas Estendidas Excedentes');
console.log('=================================================');

// Simular carregamento de configuração com excedentes
const mockConfig = `
# Configuração de teste
apartamentos_vagas_estendidas=303,403,503,603,703
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_duplas=101,102,103,104,203,301,304,402,404,501,502,604,701,702
`;

console.log('\n1. 🔧 CONFIGURAÇÃO INICIAL:');
console.log('   - Apartamentos estendidos: 5 (303, 403, 503, 603, 703)');
console.log('   - Vagas estendidas: 6 (7, 8, 21, 22, 35, 36)');
console.log('   - Excedente esperado: 1 vaga');

console.log('\n2. 🔄 CARREGANDO CONFIGURAÇÃO...');
await sorteioConfig.loadFromFile(mockConfig);

console.log('\n3. ✅ RESULTADO APÓS CONVERSÃO:');
console.log('   - Apartamentos estendidos:', sorteioConfig.apartamentosVagasEstendidas.length);
console.log('   - Vagas estendidas restantes:', sorteioConfig.vagasEstendidas.length);
console.log('   - Lista de vagas estendidas:', sorteioConfig.vagasEstendidas);

console.log('\n4. 🎯 VALIDAÇÃO:');
const apartamentosExtendidos = sorteioConfig.apartamentosVagasEstendidas.length;
const vagasEstendidas = sorteioConfig.vagasEstendidas.length;

if (apartamentosExtendidos === vagasEstendidas) {
    console.log('   ✅ SUCESSO: Apartamentos estendidos = Vagas estendidas');
    console.log(`   ✅ Balanceamento: ${apartamentosExtendidos} apartamentos para ${vagasEstendidas} vagas`);
} else {
    console.log(`   ❌ FALHA: ${apartamentosExtendidos} apartamentos para ${vagasEstendidas} vagas`);
}

console.log('\n5. 🚫 VERIFICAÇÃO DAS VAGAS PROIBIDAS PARA DUPLOS:');
// Simular função getVagasProibidasDuplo
const vagasProibidasBase = [];
const vagasEstendidasAtual = [...(sorteioConfig.vagasEstendidas || [])];
const vagasProibidasCompleta = [...new Set([...vagasProibidasBase, ...vagasEstendidasAtual])];

console.log(`   - Vagas proibidas para duplos: ${vagasProibidasCompleta.join(', ')}`);
console.log(`   - Deve conter apenas ${vagasEstendidas} vagas estendidas (não 6)`);

console.log('\n=================================================')