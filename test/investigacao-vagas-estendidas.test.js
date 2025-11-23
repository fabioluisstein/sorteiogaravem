/**
 * 🔍 TESTE INVESTIGATIVO - Apartamentos vs Vagas Estendidas
 * Este teste verifica exatamente qual é o comportamento do sistema
 * quando apartamentos não autorizados interagem com vagas estendidas
 */

import { describe, it, expect } from 'vitest';
import { isVagaEstendida, apartmentoPodeVagaEstendida } from '../src/config/sorteioConfig.js';

describe('🕵️ INVESTIGAÇÃO - Apartamentos vs Vagas Estendidas', () => {

    it('deve confirmar os apartamentos autorizados para vagas estendidas', () => {
        console.log('\n🏠 APARTAMENTOS AUTORIZADOS PARA VAGAS ESTENDIDAS:');

        const apartamentosEsperados = [303, 403, 503, 603, 703];
        const apartamentosEncontrados = [];

        // Testa todos os apartamentos de 101 a 707
        for (let andar = 1; andar <= 7; andar++) {
            for (let apt = 1; apt <= 7; apt++) {
                const apartamento = andar * 100 + apt;
                if (apartamentoPodeVagaEstendida(apartamento)) {
                    apartamentosEncontrados.push(apartamento);
                    console.log(`✅ Apartamento ${apartamento} = AUTORIZADO`);
                }
            }
        }

        console.log(`\n🎯 RESUMO: Apartamentos autorizados: [${apartamentosEncontrados.join(', ')}]`);
        console.log(`📋 Apartamentos esperados: [${apartamentosEsperados.join(', ')}]`);

        expect(apartamentosEncontrados.sort()).toEqual(apartamentosEsperados.sort());
    });

    it('deve testar o cenário completo com apartamento NÃO autorizado', () => {
        console.log('\n🧪 CENÁRIO: Apartamento 302 (não autorizado) tenta usar vagas');

        const apartamento302 = 302;
        console.log(`🏠 Apartamento ${apartamento302}: ${apartmentoPodeVagaEstendida(apartamento302) ? 'AUTORIZADO' : 'NÃO AUTORIZADO'}`);

        // Testa todas as vagas estendidas reais
        const vagasEstendidasReais = [7, 8, 21, 22, 35, 36];

        vagasEstendidasReais.forEach(vaga => {
            const vagaEhEstendida = isVagaEstendida(vaga);
            const apartamentoPode = apartmentoPodeVagaEstendida(apartamento302);

            console.log(`   Vaga ${vaga}: ${vagaEhEstendida ? 'Estendida' : 'Normal'} | Apartamento pode usar: ${apartamentoPode ? 'SIM' : 'NÃO'}`);

            expect(vagaEhEstendida).toBe(true, `Vaga ${vaga} deveria ser estendida`);
            expect(apartamentoPode).toBe(false, `Apartamento ${apartamento302} NÃO deveria poder usar vagas estendidas`);
        });
    });

    it('deve testar o cenário com apartamento AUTORIZADO', () => {
        console.log('\n🧪 CENÁRIO: Apartamento 303 (autorizado) tenta usar vagas');

        const apartamento303 = 303;
        console.log(`🏠 Apartamento ${apartamento303}: ${apartmentoPodeVagaEstendida(apartamento303) ? 'AUTORIZADO' : 'NÃO AUTORIZADO'}`);

        // Testa todas as vagas estendidas reais
        const vagasEstendidasReais = [7, 8, 21, 22, 35, 36];

        vagasEstendidasReais.forEach(vaga => {
            const vagaEhEstendida = isVagaEstendida(vaga);
            const apartamentoPode = apartmentoPodeVagaEstendida(apartamento303);

            console.log(`   Vaga ${vaga}: ${vagaEhEstendida ? 'Estendida' : 'Normal'} | Apartamento pode usar: ${apartamentoPode ? 'SIM' : 'NÃO'}`);

            expect(vagaEhEstendida).toBe(true, `Vaga ${vaga} deveria ser estendida`);
            expect(apartamentoPode).toBe(true, `Apartamento ${apartamento303} DEVERIA poder usar vagas estendidas`);
        });
    });

    it('deve verificar se há outras vagas sendo marcadas como estendidas', () => {
        console.log('\n🔍 VERIFICANDO SE HÁ VAGAS ESTRANHAS SENDO CONSIDERADAS ESTENDIDAS:');

        const vagasSuspeitas = [23, 29, 31]; // Vagas mencionadas pelo usuário como problemáticas

        vagasSuspeitas.forEach(vaga => {
            const ehEstendida = isVagaEstendida(vaga);
            console.log(`   Vaga ${vaga}: ${ehEstendida ? '🚨 ESTENDIDA (PROBLEMA!)' : '✅ Normal (OK)'}`);

            expect(ehEstendida).toBe(false, `Vaga ${vaga} NÃO deveria ser estendida - só as vagas 7, 8, 21, 22, 35, 36`);
        });
    });

    it('deve mostrar o mapeamento completo de posições para números', () => {
        console.log('\n🗺️ MAPEAMENTO COMPLETO DE POSIÇÕES PARA NÚMEROS:');

        const floors = ['G1', 'G2', 'G3'];
        const sides = {
            'G1': ['A', 'B'],
            'G2': ['C', 'D'],
            'G3': ['E', 'F']
        };

        floors.forEach(floor => {
            console.log(`\n📍 ${floor}:`);
            sides[floor].forEach(side => {
                console.log(`   Lado ${side}:`);
                for (let pos = 1; pos <= 7; pos++) {
                    // Simular o cálculo de posição para número
                    let baseNumber = 0;
                    if (floor === 'G1') baseNumber = 0;
                    if (floor === 'G2') baseNumber = 14;
                    if (floor === 'G3') baseNumber = 28;

                    let sideOffset = 0;
                    if (side === 'B' || side === 'D' || side === 'F') sideOffset = 7;

                    const numero = baseNumber + sideOffset + pos;
                    const estendida = isVagaEstendida(numero);

                    console.log(`     Posição ${pos} = Vaga ${numero} ${estendida ? '(ESTENDIDA)' : ''}`);
                }
            });
        });
    });
});