import { describe, it, expect, beforeEach } from 'vitest';
import { LotteryService } from '../src/services/LotteryService.js';

describe('🎨 Interface - Visualização de Vagas Ocupadas', () => {
    let lotteryService;
    let mockGarage;
    let mockApartments;

    beforeEach(() => {
        lotteryService = new LotteryService();

        // Mock básico de garagem com mais vagas
        mockGarage = {
            spots: [
                { id: 'G1-A1', floor: 'G1', side: 'A', pos: 1, blocked: false, occupiedBy: null, parId: 'G1-A-1-2' },
                { id: 'G1-A2', floor: 'G1', side: 'A', pos: 2, blocked: false, occupiedBy: null, parId: 'G1-A-1-2' },
                { id: 'G1-A3', floor: 'G1', side: 'A', pos: 3, blocked: false, occupiedBy: null, parId: 'G1-A-3-4' },
                { id: 'G1-A7', floor: 'G1', side: 'A', pos: 7, blocked: false, occupiedBy: null, parId: 'G1-A-7-7' }, // Vaga estendida
            ],
            pairs: {
                'G1-A-1-2': { id: 'G1-A-1-2', floor: 'G1', side: 'A', aPos: 1, bPos: 2, aId: 'G1-A1', bId: 'G1-A2', reservedFor: null },
                'G1-A-3-4': { id: 'G1-A-3-4', floor: 'G1', side: 'A', aPos: 3, bPos: 4, aId: 'G1-A3', bId: 'G1-A4', reservedFor: null },
            }
        };

        mockApartments = [
            { id: 101, dupla: false, sorteado: false, vagas: [], ativo: true },
            { id: 102, dupla: true, sorteado: false, vagas: [], ativo: true },
            { id: 303, dupla: false, sorteado: false, vagas: [], ativo: true }, // Apartamento autorizado para vagas estendidas
        ];
    });

    describe('Vaga Simples - Marcação de Ocupação', () => {
        it('deve marcar vaga normal como ocupada após sorteio', async () => {
            // Força apartamento simples para vaga normal
            const apartmentId = 101;
            const apartment = mockApartments.find(a => a.id === apartmentId);

            const result = await lotteryService.drawOneWithRetry(
                [apartment], // Apenas este apartamento
                mockGarage
            );

            expect(result.success).toBe(true);
            expect(result.apartmentId).toBe(apartmentId);
            expect(result.spot).toBeDefined();
            expect(result.garage).toBeDefined();

            // Verifica se a vaga foi marcada como ocupada na garagem retornada
            const occupiedSpot = result.garage.spots.find(s => s.id === result.spot.id);
            expect(occupiedSpot).toBeDefined();
            expect(occupiedSpot.occupiedBy).toBe(apartmentId);

            console.log(`✅ Vaga ${result.spot.id} marcada como ocupada pelo apartamento ${apartmentId}`);
        });

        it('deve marcar vaga estendida como ocupada para apartamento autorizado', async () => {
            // Remove vagas normais para forçar uso de vaga estendida
            const garageOnlyExtended = {
                ...mockGarage,
                spots: mockGarage.spots.filter(s => s.pos === 7) // Apenas vaga estendida
            };

            const apartmentId = 303; // Apartamento autorizado
            const apartment = mockApartments.find(a => a.id === apartmentId);

            const result = await lotteryService.drawOneWithRetry(
                [apartment],
                garageOnlyExtended
            );

            expect(result.success).toBe(true);
            expect(result.apartmentId).toBe(apartmentId);
            expect(result.spot).toBeDefined();
            expect(result.garage).toBeDefined();

            // Verifica se a vaga estendida foi marcada como ocupada
            const occupiedSpot = result.garage.spots.find(s => s.id === result.spot.id);
            expect(occupiedSpot).toBeDefined();
            expect(occupiedSpot.occupiedBy).toBe(apartmentId);

            console.log(`🟠 Vaga estendida ${result.spot.id} marcada como ocupada pelo apartamento autorizado ${apartmentId}`);
        });
    });

    describe('Vaga Dupla - Marcação de Ocupação', () => {
        it('deve marcar ambas as vagas do par como ocupadas', async () => {
            const apartmentId = 102; // Apartamento duplo
            const apartment = mockApartments.find(a => a.id === apartmentId);

            const result = await lotteryService.drawOneWithRetry(
                [apartment],
                mockGarage
            );

            expect(result.success).toBe(true);
            expect(result.apartmentId).toBe(apartmentId);
            expect(result.pair).toBeDefined();
            expect(result.garage).toBeDefined();

            // Verifica se ambas as vagas do par foram marcadas como ocupadas
            const spotA = result.garage.spots.find(s => s.id === result.pair.aId);
            const spotB = result.garage.spots.find(s => s.id === result.pair.bId);

            expect(spotA).toBeDefined();
            expect(spotA.occupiedBy).toBe(apartmentId);
            expect(spotB).toBeDefined();
            expect(spotB.occupiedBy).toBe(apartmentId);

            console.log(`✅ Par ${result.pair.id} (vagas ${result.pair.aId}, ${result.pair.bId}) marcado como ocupado pelo apartamento ${apartmentId}`);
        });
    });

    describe('Validação de Estado da Interface', () => {
        it('deve garantir que vagas ocupadas não aparecem como livres', async () => {
            const apartment1 = mockApartments[0]; // 101
            const apartment2 = mockApartments[2]; // 303

            // Primeiro sorteio
            const result1 = await lotteryService.drawOneWithRetry([apartment1], mockGarage);
            expect(result1.success).toBe(true);

            // Segundo sorteio com garagem atualizada
            const result2 = await lotteryService.drawOneWithRetry([apartment2], result1.garage);
            expect(result2.success).toBe(true);

            // Verifica que as duas vagas diferentes foram ocupadas
            expect(result1.spot.id).not.toBe(result2.spot.id);

            // Verifica estado final da garagem
            const finalSpots = result2.garage.spots;
            const occupiedSpots = finalSpots.filter(s => s.occupiedBy);

            expect(occupiedSpots).toHaveLength(2);
            expect(occupiedSpots.find(s => s.id === result1.spot.id)?.occupiedBy).toBe(101);
            expect(occupiedSpots.find(s => s.id === result2.spot.id)?.occupiedBy).toBe(303);

            console.log(`✅ Estado final validado: 2 vagas ocupadas por apartamentos diferentes`);
        });
    });
});