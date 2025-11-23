/**
 * 🔍 TESTE INVESTIGATIVO SIMPLES - Apartamentos vs Vagas Estendidas
 * Este teste verifica exatamente qual é o comportamento do sistema
 * Sem frameworks, apenas imports e console.log
 */

import { isVagaEstendida, apartmentoPodeVagaEstendida } from '../src/config/sorteioConfig.js';

console.log('\n🕵️ INVESTIGAÇÃO - Apartamentos vs Vagas Estendidas');
console.log('====================================================\n');

// Teste 1: Apartamentos autorizados
console.log('🏠 APARTAMENTOS AUTORIZADOS PARA VAGAS ESTENDIDAS:');
const apartamentosEsperados = [303, 403, 503, 603, 703];
const apartamentosEncontrados = [];

for (let andar = 1; andar <= 7; andar++) {
    for (let apt = 1; apt <= 7; apt++) {
        const apartamento = andar * 100 + apt;
        if (apartmentoPodeVagaEstendida(apartamento)) {
            apartamentosEncontrados.push(apartamento);
            console.log(`✅ Apartamento ${apartamento} = AUTORIZADO`);
        }
    }
}

console.log(`\n🎯 RESUMO: Apartamentos autorizados: [${apartamentosEncontrados.join(', ')}]`);
console.log(`📋 Apartamentos esperados: [${apartamentosEsperados.join(', ')}]`);

// Teste 2: Apartamento NÃO autorizado tentando usar vagas
console.log('\n🧪 CENÁRIO: Apartamento 302 (não autorizado) tenta usar vagas');
const apartamento302 = 302;
console.log(`🏠 Apartamento ${apartamento302}: ${apartmentoPodeVagaEstendida(apartamento302) ? 'AUTORIZADO' : 'NÃO AUTORIZADO'}`);

const vagasEstendidasReais = [7, 8, 21, 22, 35, 36];
vagasEstendidasReais.forEach(vaga => {
    const vagaEhEstendida = isVagaEstendida(vaga);
    const apartamentoPode = apartmentoPodeVagaEstendida(apartamento302);
    console.log(`   Vaga ${vaga}: ${vagaEhEstendida ? 'Estendida' : 'Normal'} | Apartamento pode usar: ${apartamentoPode ? 'SIM' : 'NÃO'}`);
});

// Teste 3: Apartamento AUTORIZADO tentando usar vagas
console.log('\n🧪 CENÁRIO: Apartamento 303 (autorizado) tenta usar vagas');
const apartamento303 = 303;
console.log(`🏠 Apartamento ${apartamento303}: ${apartmentoPodeVagaEstendida(apartamento303) ? 'AUTORIZADO' : 'NÃO AUTORIZADO'}`);

vagasEstendidasReais.forEach(vaga => {
    const vagaEhEstendida = isVagaEstendida(vaga);
    const apartamentoPode = apartmentoPodeVagaEstendida(apartamento303);
    console.log(`   Vaga ${vaga}: ${vagaEhEstendida ? 'Estendida' : 'Normal'} | Apartamento pode usar: ${apartamentoPode ? 'SIM' : 'NÃO'}`);
});

// Teste 4: Vagas suspeitas
console.log('\n🔍 VERIFICANDO VAGAS SUSPEITAS:');
const vagasSuspeitas = [23, 29, 31]; // Vagas mencionadas pelo usuário
vagasSuspeitas.forEach(vaga => {
    const ehEstendida = isVagaEstendida(vaga);
    console.log(`   Vaga ${vaga}: ${ehEstendida ? '🚨 ESTENDIDA (PROBLEMA!)' : '✅ Normal (OK)'}`);
});

// Teste 5: Todas as vagas de 1 a 42
console.log('\n📊 MAPEAMENTO COMPLETO DE TODAS AS VAGAS:');
for (let vaga = 1; vaga <= 42; vaga++) {
    const ehEstendida = isVagaEstendida(vaga);
    if (ehEstendida) {
        console.log(`🎯 Vaga ${vaga} = ESTENDIDA`);
    }
}

console.log('\n✨ INVESTIGAÇÃO CONCLUÍDA! Verifique os resultados acima.\n');