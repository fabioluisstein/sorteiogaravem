/**
 * 🎯 TESTE: Verificar Carregamento da Configuração
 */

import { sorteioConfig, getVagasProibidasDuplo } from './src/config/sorteioConfig.js';

console.log('🧪 ===== TESTE: CARREGAMENTO DA CONFIGURAÇÃO =====\n');

console.log('📋 Verificando configuração direta:');
console.log(`   sorteioConfig.vagasEstendidas: ${JSON.stringify(sorteioConfig.vagasEstendidas)}`);
console.log(`   sorteioConfig.vagasProibidasDuplo: ${JSON.stringify(sorteioConfig.vagasProibidasDuplo)}`);

console.log('\n📋 Verificando configuração interna:');
console.log(`   sorteioConfig.config.vagas_estendidas: ${JSON.stringify(sorteioConfig.config.vagas_estendidas)}`);
console.log(`   sorteioConfig.config.vagas_proibidas_duplo: ${JSON.stringify(sorteioConfig.config.vagas_proibidas_duplo)}`);

console.log('\n🔧 Chamando getVagasProibidasDuplo():');
const vagas = getVagasProibidasDuplo();
console.log(`   Resultado: ${JSON.stringify(vagas)}`);

console.log('\n✅ Verificação concluída!');