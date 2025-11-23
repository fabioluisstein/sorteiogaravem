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

    const spots = []; // {id,floor,side,pos,parId,blocked,occupiedBy}
    const pairs = {}; // parId -> {id,floor,side,aPos,bPos,aId,bId,reservedFor}

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
                const [p1, p2] = naturalPair || [pos, pos]; // fallback para posições sem par
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

describe('🚨 DETECÇÃO DE APARTAMENTOS SEM VAGA', () => {
    describe('Cenários de Falha - Apartamentos Ficam Sem Vaga', () => {
        it('deve garantir que TODOS os apartamentos recebam vagas', async () => {
            const lotteryService = new LotteryService()
            lotteryService.setSeed(12345) // Seed determinística

            // Lista realista de apartamentos para teste (compatível com 42 vagas)
            const apartamentosEsperados = [
                // Apartamentos duplos (7 apartamentos = 14 vagas)
                101, 102, 103, 104, 203, 301, 304,
                // Apartamentos simples com direito a estendidas (5 apartamentos = 5 vagas)
                303, 403, 503, 603, 703,
                // Outros apartamentos simples (23 apartamentos = 23 vagas)
                201, 202, 204, 205, 206, 207, 302, 305, 306, 307,
                401, 405, 406, 407, 504, 505, 506, 507,
                601, 602, 605, 606, 607
                // Total: 35 apartamentos = 42 vagas (7×2 + 28×1)
            ]

            console.log(`📋 TOTAL DE APARTAMENTOS ESPERADOS: ${apartamentosEsperados.length}`)

            // Simular múltiplos sorteios para verificar se todos conseguem vagas
            let tentativas = 0
            let apartamentosComVaga = new Set()
            let apartamentosSemVaga = []

            // Tentativas de sorteio
            while (tentativas < apartamentosEsperados.length && apartamentosComVaga.size < apartamentosEsperados.length) {
                tentativas++

                try {
                    // Criar apartamentos com estrutura correta
                    const apartamentosParaSorteio = apartamentosEsperados.map(id => {
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

                    // Usar garagem correta
                    const garage = buildInitialGarage();

                    const resultado = await lotteryService.drawOneWithRetry(apartamentosParaSorteio, garage)

                    if (resultado.success && resultado.apartmentId) {
                        apartamentosComVaga.add(resultado.apartmentId)
                        console.log(`✅ Tentativa ${tentativas}: Apartamento ${resultado.apartmentId} recebeu vaga`)
                    } else {
                        console.log(`❌ Tentativa ${tentativas}: Falhou - ${resultado.error}`)
                    }
                } catch (error) {
                    console.log(`💥 Tentativa ${tentativas}: Erro - ${error.message}`)
                }

                // Reset para próxima tentativa
                lotteryService.reset()
            }

            // Identificar apartamentos que ficaram sem vaga
            apartamentosSemVaga = apartamentosEsperados.filter(id => !apartamentosComVaga.has(id))

            console.log(`\n📊 RESULTADO FINAL:`)
            console.log(`   Apartamentos com vaga: ${apartamentosComVaga.size}/${apartamentosEsperados.length}`)
            console.log(`   Apartamentos SEM vaga: ${apartamentosSemVaga.length}`)

            if (apartamentosSemVaga.length > 0) {
                console.log(`\n🚨 APARTAMENTOS QUE FICARAM SEM VAGA:`)
                for (const id of apartamentosSemVaga) {
                    console.log(`   - Apartamento ${id}`)
                }
            }

            // ASSERTION PRINCIPAL
            expect(apartamentosSemVaga.length).toBe(0,
                `${apartamentosSemVaga.length} apartamentos ficaram sem vaga: ${apartamentosSemVaga.join(', ')}`
            )
        })

        it('deve verificar se há vagas suficientes para todos os apartamentos', () => {
            // Total de vagas disponíveis
            const totalVagas = 42

            // Apartamentos duplos (precisam de 2 vagas cada)
            const apartamentosDuplos = [101, 102, 103, 104, 203, 301, 304]
            const vagasNecessariasDuplos = apartamentosDuplos.length * 2

            // Apartamentos simples (precisam de 1 vaga cada)  
            const apartamentosSimples = [
                303, 403, 503, 603, 703, // com direito a estendidas
                201, 202, 204, 205, 206, 207, 302, 305, 306, 307,
                401, 405, 406, 407, 504, 505, 506, 507,
                601, 602, 605, 606, 607
            ]
            const vagasNecessariasSimples = apartamentosSimples.length * 1

            const totalVagasNecessarias = vagasNecessariasDuplos + vagasNecessariasSimples

            console.log(`\n🧮 CÁLCULO DE VAGAS:`)
            console.log(`   Apartamentos duplos: ${apartamentosDuplos.length} × 2 = ${vagasNecessariasDuplos} vagas`)
            console.log(`   Apartamentos simples: ${apartamentosSimples.length} × 1 = ${vagasNecessariasSimples} vagas`)
            console.log(`   TOTAL NECESSÁRIO: ${totalVagasNecessarias} vagas`)
            console.log(`   TOTAL DISPONÍVEL: ${totalVagas} vagas`)
            console.log(`   SALDO: ${totalVagas - totalVagasNecessarias} vagas`)

            // Verificar se há vagas suficientes
            expect(totalVagas).toBeGreaterThanOrEqual(totalVagasNecessarias,
                `Não há vagas suficientes! Necessário: ${totalVagasNecessarias}, Disponível: ${totalVagas}`
            )
        })
    })
})