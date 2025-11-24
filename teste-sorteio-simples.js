/**
 * Teste do Sistema de Sorteio Simples
 */

import { SorteioSimples } from './src/SorteioSimples.js';

// Criar nova instância do sorteio
const sorteio = new SorteioSimples();

console.log('🧪 TESTE DO SORTEIO SIMPLES');
console.log('===========================');

// Executar sorteio
const resultado = sorteio.sorteio();

if (resultado.sucesso) {
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`   - Vagas ocupadas: ${resultado.estatisticas.vagasOcupadas}/42`);
    console.log(`   - Apartamentos sorteados: ${resultado.estatisticas.apartamentosSorteados}/28`);
    console.log(`   - Vagas livres: ${resultado.estatisticas.vagasLivres}`);

    console.log('\n🏆 RESULTADOS POR TIPO:');
    const duplos = resultado.resultados.filter(r => r.tipo === 'duplo');
    const estendidos = resultado.resultados.filter(r => r.tipo === 'estendido');
    const simples = resultado.resultados.filter(r => r.tipo === 'simples');

    console.log(`   - Duplos: ${duplos.length} sorteados`);
    console.log(`   - Estendidos: ${estendidos.length} sorteados`);
    console.log(`   - Simples: ${simples.length} sorteados`);

} else {
    console.error('❌ Erro no sorteio:', resultado.erro);
}

// Exemplo de como resetar e fazer novo sorteio
console.log('\n🔄 TESTANDO RESET...');
sorteio.resetar();

console.log('\n🎲 SEGUNDO SORTEIO...');
const resultado2 = sorteio.sorteio();

if (resultado2.sucesso) {
    console.log('✅ Segundo sorteio concluído com sucesso!');
}