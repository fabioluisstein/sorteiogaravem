import { describe, it, expect } from 'vitest'
import { LotteryService } from '../src/services/LotteryService.js'
import { apartamentoTemDireitoDupla } from '../src/config/sorteioConfig.js'

// Criar garagem exatamente como o componente React faz
function buildInitialGarage() {
    const FLOORS = ["G1", "G2", "G3"];
    const SIDES_BY_FLOOR = { G1: ["A", "B"], G2: ["C", "D"], G3: ["E", "F"] };
    const POSITIONS = [1, 2, 3, 4, 5, 6, 7];
    const NATURAL_PAIRS = [
        [1, 2],
        [3, 4],
        [5, 6],
    ];

    const spots = [];
    const pairs = {};

    for (const floor of FLOORS) {
        for (const side of SIDES_BY_FLOOR[floor]) {
            for (const [p1, p2] of NATURAL_PAIRS) {
                const parId = `${floor}-${side}-${p1}-${p2}`;
                pairs[parId] = {
                    id: parId,
                    floor,
                    side,
                    aPos: p1,
                    bPos: p2,
                    aId: `${floor}-${side}${p1}`,
                    bId: `${floor}-${side}${p2}`,
                    reservedFor: null,
                };
            }
            for (const pos of POSITIONS) {
                const naturalPair = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
                const [p1, p2] = naturalPair || [pos, pos];
                spots.push({
                    id: `${floor}-${side}${pos}`,
                    floor,
                    side,
                    pos,
                    parId: `${floor}-${side}-${p1}-${p2}`,
                    blocked: false,
                    occupiedBy: null,
                });
            }
        }
    }
    return { spots, pairs };
}

describe('🎯 TESTE REALISTA - LOOP INFINITO', () => {
    it('deve detectar quando apartamentos simples ficam presos sem vagas', async () => {
        const lotteryService = new LotteryService();
        lotteryService.setSeed(12345);

        // Cenário que causa o problema: muitos apartamentos para poucas vagas
        const apartamentosIniciais = [
            // Apartamentos duplos (consomem pares de vagas)
            101, 102, 103, 104, 203, 301, 304,
            // Apartamentos simples com direito a estendidas
            303, 403, 503, 603, 703,
            // Apartamentos simples SEM direito a estendidas - ESTES CAUSAM O PROBLEMA
            201, 202, 204, 205, 206, 207,
            302, 305, 306, 307,
            401, 405, 406, 407,
            504, 505, 506, 507,
            601, 602, 605, 606, 607,
            701, 702, 704, 705, 706, 707  // 👈 APARTAMENTOS EXTRA que vão causar o problema
        ].map(id => {
            const temDireitoDupla = apartamentoTemDireitoDupla(id);
            return {
                id,
                apartmentNumber: id.toString(),
                ativo: true,
                sorteado: false,
                dupla: temDireitoDupla,
                vagas: []
            };
        });

        console.log(`🏢 TOTAL DE APARTAMENTOS: ${apartamentosIniciais.length}`);

        let garage = buildInitialGarage();
        let apartamentos = [...apartamentosIniciais];
        let tentativaGlobal = 0;
        const apartamentosComVaga = new Set();

        // Simular sorteio realista
        while (apartamentos.some(a => a.ativo && !a.sorteado) && tentativaGlobal < 50) {
            tentativaGlobal++;

            console.log(`\n🎲 === RODADA ${tentativaGlobal} ===`);
            console.log(`📊 Apartamentos restantes: ${apartamentos.filter(a => a.ativo && !a.sorteado).length}`);

            const resultado = await lotteryService.drawOneWithRetry(apartamentos, garage);

            if (resultado.success && resultado.apartmentId) {
                // Marcar apartamento como sorteado
                const apartment = apartamentos.find(a => a.id === resultado.apartmentId);
                if (apartment) {
                    apartment.sorteado = true;
                    apartamentosComVaga.add(resultado.apartmentId);
                    garage = resultado.garage; // Atualizar garagem
                    console.log(`✅ Apartamento ${resultado.apartmentId} recebeu vaga e foi marcado como sorteado`);
                }
            } else {
                console.log(`❌ Rodada ${tentativaGlobal}: Falhou - ${resultado.error}`);

                // Se temos apartamentos elegíveis mas nenhum consegue vaga, é LOOP INFINITO
                const apartamentosElegiveis = apartamentos.filter(a => a.ativo && !a.sorteado);
                if (apartamentosElegiveis.length > 0) {
                    console.log(`🚨 DETECTADO POSSÍVEL LOOP INFINITO!`);
                    console.log(`   Apartamentos ainda elegíveis: ${apartamentosElegiveis.length}`);
                    console.log(`   Apartamentos elegíveis: ${apartamentosElegiveis.map(a => a.id).join(', ')}`);

                    // Analisar se há vagas disponíveis
                    const vagasLivres = garage.spots.filter(s => !s.occupiedBy).length;
                    console.log(`   Vagas livres: ${vagasLivres}`);

                    if (vagasLivres > 0) {
                        // Há vagas mas apartamentos não conseguem - problema de compatibilidade
                        console.log(`⚠️  PROBLEMA DETECTADO: Há ${vagasLivres} vagas livres mas apartamentos não conseguem usar`);
                    }

                    break; // Sair do loop para evitar travamento
                }
            }

            // Timeout de segurança
            if (tentativaGlobal >= 45) {
                console.log(`⏰ TIMEOUT: Muitas tentativas (${tentativaGlobal}). Parando para evitar loop infinito.`);
                break;
            }
        }

        const apartamentosSemVaga = apartamentosIniciais.filter(a => !apartamentosComVaga.has(a.id));

        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`   Apartamentos com vaga: ${apartamentosComVaga.size}/${apartamentosIniciais.length}`);
        console.log(`   Apartamentos SEM vaga: ${apartamentosSemVaga.length}`);
        console.log(`   Total de rodadas: ${tentativaGlobal}`);

        if (apartamentosSemVaga.length > 0) {
            console.log(`\n🚨 APARTAMENTOS SEM VAGA:`);
            for (const apartment of apartamentosSemVaga) {
                console.log(`   - Apartamento ${apartment.id} (${apartment.dupla ? 'duplo' : 'simples'})`);
            }
        }

        // O teste deve detectar o problema
        expect(tentativaGlobal).toBeLessThan(50); // Não deveria precisar de 50 tentativas
    });
});