/**
 * 🔍 TESTE DE DEBUG - Verificação das Vagas Estendidas
 * Este teste verifica exatamente quais vagas o sistema reconhece como estendidas
 * para identificar a diferença entre arquivo .properties e código
 */

import { describe, it, expect } from 'vitest';
import { isVagaEstendida } from '../src/config/sorteioConfig.js';

describe('🔍 DEBUG - Vagas Estendidas', () => {

    it('deve listar TODAS as vagas que o sistema reconhece como estendidas', () => {
        console.log('\n📋 LISTANDO TODAS AS VAGAS ESTENDIDAS RECONHECIDAS PELO SISTEMA:');

        const vagasEncontradas = [];

        // Testa todas as vagas de 1 a 42
        for (let vaga = 1; vaga <= 42; vaga++) {
            if (isVagaEstendida(vaga)) {
                vagasEncontradas.push(vaga);
                console.log(`✅ Vaga ${vaga} = ESTENDIDA`);
            } else {
                console.log(`❌ Vaga ${vaga} = normal`);
            }
        }

        console.log(`\n🎯 RESUMO: Vagas estendidas encontradas: [${vagasEncontradas.join(', ')}]`);
        console.log(`📊 Total de vagas estendidas: ${vagasEncontradas.length}`);

        // Comparação com o arquivo sorteio.properties
        const vagasDoArquivo = [7, 8, 21, 22, 35, 36];
        console.log(`📋 Vagas do arquivo .properties: [${vagasDoArquivo.join(', ')}]`);

        const iguais = JSON.stringify(vagasEncontradas.sort()) === JSON.stringify(vagasDoArquivo.sort());
        console.log(`🔍 As listas são iguais? ${iguais ? '✅ SIM' : '❌ NÃO'}`);

        if (!iguais) {
            const sobrandoNoSistema = vagasEncontradas.filter(v => !vagasDoArquivo.includes(v));
            const faltandoNoSistema = vagasDoArquivo.filter(v => !vagasEncontradas.includes(v));

            console.log(`🟠 Vagas SOBRANDO no sistema (não estão no arquivo): [${sobrandoNoSistema.join(', ')}]`);
            console.log(`🔴 Vagas FALTANDO no sistema (estão no arquivo): [${faltandoNoSistema.join(', ')}]`);
        }

        // Esta assertion vai mostrar exatamente quais vagas estão diferentes
        expect(vagasEncontradas.sort()).toEqual(vagasDoArquivo.sort());
    });

    it('deve confirmar as vagas específicas do arquivo sorteio.properties', () => {
        const vagasEsperadas = [7, 8, 21, 22, 35, 36];

        console.log('\n🎯 TESTANDO VAGAS ESPECÍFICAS DO ARQUIVO:');

        vagasEsperadas.forEach(vaga => {
            const resultado = isVagaEstendida(vaga);
            console.log(`   Vaga ${vaga}: ${resultado ? '✅ Estendida' : '❌ Normal'}`);
            expect(resultado).toBe(true, `Vaga ${vaga} deveria ser estendida segundo arquivo .properties`);
        });
    });

    it('deve rejeitar vagas que NÃO estão no arquivo sorteio.properties', () => {
        const vagasQueNaoDevemSerEstendidas = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42];

        console.log('\n❌ TESTANDO VAGAS QUE NÃO DEVEM SER ESTENDIDAS:');

        vagasQueNaoDevemSerEstendidas.forEach(vaga => {
            const resultado = isVagaEstendida(vaga);
            if (resultado) {
                console.log(`🚨 ERRO: Vaga ${vaga} foi reconhecida como ESTENDIDA mas NÃO deveria ser!`);
            } else {
                console.log(`   Vaga ${vaga}: ✅ Corretamente normal`);
            }
            expect(resultado).toBe(false, `Vaga ${vaga} NÃO deveria ser estendida`);
        });
    });
});