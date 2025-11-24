import { SorteioSimples } from './src/SorteioSimples.js';

console.log('🎲 Testando sorteio completo com pares oficiais:');
console.log('='.repeat(50));

const sorteio = new SorteioSimples();

// Executar sorteio
const resultado = sorteio.sorteio();

console.log('\n📊 RESULTADO DO SORTEIO:');
console.log(`✅ Status: ${resultado.sucesso ? 'SUCESSO' : 'FALHA'}`);

if (resultado.sucesso) {
    console.log(`📈 Apartamentos sorteados: ${resultado.estatisticas.apartamentosSorteados}/28`);
    console.log(`🅿️ Vagas atribuídas: ${resultado.estatisticas.vagasAtribuidas}/42`);
    console.log(`📋 Vagas livres restantes: ${resultado.estatisticas.vagasLivres}`);

    // Verificar resultados por tipo
    const duplos = resultado.resultados.filter(r => r.tipo === 'duplo');
    const estendidos = resultado.resultados.filter(r => r.tipo === 'estendido');
    const simples = resultado.resultados.filter(r => r.tipo === 'simples');

    console.log('\n📋 DISTRIBUIÇÃO POR TIPO:');
    console.log(`🏢 Apartamentos duplos: ${duplos.length}/14`);
    console.log(`🏗️ Apartamentos estendidos: ${estendidos.length}/4`);
    console.log(`🏠 Apartamentos simples: ${simples.length}/10`);

    // Verificar se todos os duplos receberam pares válidos
    console.log('\n🔍 VALIDAÇÃO DOS PARES DUPLOS:');
    let paresValidos = 0;
    let paresInvalidos = 0;

    duplos.forEach(duplo => {
        if (duplo.vagas.length === 2) {
            const [vaga1, vaga2] = duplo.vagas.sort((a, b) => a - b);

            // Verificar se o par está na lista oficial
            const paresOficiais = [
                [1, 2], [3, 4], [5, 6],         // G1-A
                [9, 10], [11, 12], [13, 14],    // G1-B  
                [15, 16], [17, 18], [19, 20],   // G2-C
                [23, 24], [25, 26], [27, 28],   // G2-D
                [29, 30], [31, 32], [33, 34],   // G3-E
                [37, 38], [39, 40], [41, 42]    // G3-F
            ];

            const parValido = paresOficiais.some(([a, b]) => a === vaga1 && b === vaga2);

            if (parValido) {
                console.log(`✅ Apto ${duplo.apartamento}: Vagas ${vaga1}-${vaga2} (par oficial)`);
                paresValidos++;
            } else {
                console.log(`❌ Apto ${duplo.apartamento}: Vagas ${vaga1}-${vaga2} (par INVÁLIDO!)`);
                paresInvalidos++;
            }
        } else {
            console.log(`❌ Apto ${duplo.apartamento}: ${duplo.vagas.length} vagas (deveria ter 2)`);
            paresInvalidos++;
        }
    });

    console.log(`\n🎯 Resumo da validação:`);
    console.log(`✅ Pares válidos: ${paresValidos}`);
    console.log(`❌ Pares inválidos: ${paresInvalidos}`);

    if (paresInvalidos === 0) {
        console.log('🎉 TODOS OS PARES SÃO OFICIAIS - SISTEMA FUNCIONANDO CORRETAMENTE!');
    } else {
        console.log('⚠️ PROBLEMA: Alguns apartamentos duplos receberam pares inválidos!');
    }
} else {
    console.log(`❌ Erro: ${resultado.erro}`);
}