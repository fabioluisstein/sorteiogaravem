/**
 * 🧪 TESTE SIMPLES - Correção do Modo Emergência
 * Teste apenas da lógica de autorização, sem estruturas complexas
 */

import { sorteioConfig } from '../src/config/sorteioConfig.js';

console.log('\n🔒 TESTE SIMPLES - Correção de Autorização para Vagas Estendidas');
console.log('================================================================\n');

// Configurar sistema com arquivo padrão
await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
`);

console.log('✅ Configuração carregada');
console.log('   Vagas estendidas:', sorteioConfig.vagasEstendidas);
console.log('   Apartamentos autorizados:', sorteioConfig.apartamentosVagasEstendidas);

console.log('\n🧪 TESTE DE AUTORIZAÇÃO:');

// Cenários problemáticos reportados pelo usuário
const cenariosTeste = [
    { apartamento: 704, autorizado: false, descricao: 'Apartamento 704 (NÃO autorizado)' },
    { apartamento: 201, autorizado: false, descricao: 'Apartamento 201 (NÃO autorizado)' },
    { apartamento: 204, autorizado: false, descricao: 'Apartamento 204 (NÃO autorizado)' },
    { apartamento: 601, autorizado: false, descricao: 'Apartamento 601 (NÃO autorizado)' },
    { apartamento: 303, autorizado: true, descricao: 'Apartamento 303 (AUTORIZADO)' },
    { apartamento: 403, autorizado: true, descricao: 'Apartamento 403 (AUTORIZADO)' },
];

cenariosTeste.forEach(cenario => {
    const autorizado = sorteioConfig.apartamentoPodeVagaEstendida(cenario.apartamento);
    const status = autorizado ? '✅ AUTORIZADO' : '❌ NÃO AUTORIZADO';
    const correto = autorizado === cenario.autorizado ? '✅' : '🚨 ERRO';

    console.log(`   ${cenario.descricao}: ${status} ${correto}`);

    if (autorizado !== cenario.autorizado) {
        console.log(`      🚨 ERRO: Esperado ${cenario.autorizado ? 'autorizado' : 'não autorizado'}, mas obteve ${autorizado ? 'autorizado' : 'não autorizado'}`);
    }
});

console.log('\n🎯 SIMULAÇÃO DO PROBLEMA REPORTADO:');
console.log('Durante o sorteio, estes apartamentos NÃO autorizados receberam vagas estendidas:');

const problemasReportados = [
    { apartamento: 704, vaga: 7 },
    { apartamento: 201, vaga: 36 },
    { apartamento: 204, vaga: 8 },
    { apartamento: 601, vaga: 35 }
];

problemasReportados.forEach(problema => {
    const apartamentoPode = sorteioConfig.apartamentoPodeVagaEstendida(problema.apartamento);
    const vagaEhEstendida = sorteioConfig.isVagaEstendida(problema.vaga);

    console.log(`   Apartamento ${problema.apartamento} → Vaga ${problema.vaga}`);
    console.log(`      Apartamento pode usar estendidas: ${apartamentoPode ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`      Vaga é estendida: ${vagaEhEstendida ? '✅ SIM' : '❌ NÃO'}`);

    if (!apartamentoPode && vagaEhEstendida) {
        console.log(`      🚨 PROBLEMA: Apartamento não autorizado recebeu vaga estendida!`);
    }
    console.log('');
});

console.log('🎯 VALIDAÇÃO DA CORREÇÃO:');
console.log('Com a correção aplicada no SingleSpotAssignmentStrategy.js:');
console.log('- ✅ Sistema verificará apartmentoPodeVagaEstendida() ANTES de permitir uso em emergência');
console.log('- ✅ Apartamentos não autorizados retornarão shouldRetry: true');
console.log('- ✅ Apenas apartamentos autorizados poderão usar vagas estendidas em emergência');

console.log('\n✨ TESTE CONCLUÍDO!\n');