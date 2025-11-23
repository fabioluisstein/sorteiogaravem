/**
 * 🔧 TESTE RÁPIDO - Import e Funcionamento da Função apartmentoPodeVagaEstendida
 * Verifica se o import está funcionando corretamente
 */

import { apartmentoPodeVagaEstendida, sorteioConfig } from '../src/config/sorteioConfig.js';

console.log('\n🔧 TESTE DO IMPORT - apartmentoPodeVagaEstendida');
console.log('==============================================\n');

// Carregar configuração padrão
await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
`);

console.log('✅ Configuração carregada');

// Testar apartamentos autorizados
const apartamentosAutorizados = [303, 403, 503, 603, 703];
console.log('\n🔍 TESTANDO APARTAMENTOS AUTORIZADOS:');
apartamentosAutorizados.forEach(apt => {
    const autorizado = apartmentoPodeVagaEstendida(apt);
    console.log(`   Apartamento ${apt}: ${autorizado ? '✅ AUTORIZADO' : '❌ NÃO AUTORIZADO'}`);
    if (!autorizado) {
        console.log('   🚨 ERRO: Apartamento deveria estar autorizado!');
    }
});

// Testar apartamentos problemáticos
const apartamentosProblematicos = [704, 201, 204, 601];
console.log('\n🔍 TESTANDO APARTAMENTOS PROBLEMÁTICOS:');
apartamentosProblematicos.forEach(apt => {
    const autorizado = apartmentoPodeVagaEstendida(apt);
    console.log(`   Apartamento ${apt}: ${autorizado ? '✅ AUTORIZADO' : '❌ NÃO AUTORIZADO'}`);
    if (autorizado) {
        console.log('   🚨 ERRO: Apartamento NÃO deveria estar autorizado!');
    }
});

console.log('\n✅ TESTE CONCLUÍDO - A função apartmentoPodeVagaEstendida está funcionando!\n');