import { describe, it, expect } from 'vitest';
import { LotteryService } from '../src/services/LotteryService.js';

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

describe('🔍 DEBUG BÁSICO', () => {
    it('deve testar uma única atribuição', async () => {
        // Apartamento simples
        const apartamento = {
            id: 101,
            apartmentNumber: '101',
            type: 'simple',
            ativo: true,
            sorteado: false,
            dupla: false,
            vagas: []
        };

        console.log('🏢 Apartamento:', apartamento);

        // Criar garagem
        const garage = buildInitialGarage();
        console.log('🏗️ Total de vagas:', garage.spots.length);
        console.log('🆓 Vagas livres iniciais:', garage.spots.filter(s => !s.occupiedBy).length);

        // Testar atribuição
        const lotteryService = new LotteryService();
        const resultado = await lotteryService.drawOneWithRetry([apartamento], garage);

        console.log('📋 Resultado completo:', resultado);
        console.log('✅ Sucesso?', resultado.success);
        console.log('❌ Erro:', resultado.error);
        console.log('🎯 Detalhes:', resultado.assignmentResult);

        // Verificação simples
        expect(resultado).toBeDefined();
        expect(resultado.success).toBe(true);
    });
});