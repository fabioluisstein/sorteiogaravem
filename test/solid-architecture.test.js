import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../src/services/ValidationService.js';
import { RandomnessService } from '../src/services/RandomnessService.js';
import { LotteryService } from '../src/services/LotteryService.js';

describe('Nova Arquitetura SOLID - Testes de Funcionalidade', () => {
    let lotteryService;
    let mockGarage;
    let mockApartments;

    beforeEach(() => {
        lotteryService = new LotteryService();

        // Mock básico de garagem
        mockGarage = {
            spots: [
                { id: 'G1-A1', floor: 'G1', side: 'A', pos: 1, blocked: false, occupiedBy: null, parId: 'G1-A-1-2' },
                { id: 'G1-A2', floor: 'G1', side: 'A', pos: 2, blocked: false, occupiedBy: null, parId: 'G1-A-1-2' },
                { id: 'G1-A7', floor: 'G1', side: 'A', pos: 7, blocked: false, occupiedBy: null, parId: 'G1-A-7-7' }, // Vaga estendida
            ],
            pairs: {
                'G1-A-1-2': { id: 'G1-A-1-2', floor: 'G1', side: 'A', aPos: 1, bPos: 2, aId: 'G1-A1', bId: 'G1-A2', reservedFor: null },
            }
        };

        mockApartments = [
            { id: 101, dupla: false, sorteado: false, vagas: [], ativo: true },
            { id: 102, dupla: true, sorteado: false, vagas: [], ativo: true },
            { id: 303, dupla: false, sorteado: false, vagas: [], ativo: true }, // Apartamento autorizado para vagas estendidas
        ];
    });

    describe('ValidationService', () => {
        it('deve identificar corretamente apartamentos autorizados para vagas estendidas', () => {
            expect(ValidationService.apartmentCanHaveExtendedSpot(303)).toBe(true);
            expect(ValidationService.apartmentCanHaveExtendedSpot(403)).toBe(true);
            expect(ValidationService.apartmentCanHaveExtendedSpot(503)).toBe(true);
            expect(ValidationService.apartmentCanHaveExtendedSpot(603)).toBe(true);
            expect(ValidationService.apartmentCanHaveExtendedSpot(703)).toBe(true);

            // Apartamentos não autorizados
            expect(ValidationService.apartmentCanHaveExtendedSpot(101)).toBe(false);
            expect(ValidationService.apartmentCanHaveExtendedSpot(302)).toBe(false);
            expect(ValidationService.apartmentCanHaveExtendedSpot(704)).toBe(false);
        });

        it('deve validar atribuições de vagas estendidas', () => {
            // Apartamento autorizado pode receber vaga estendida
            const validAssignment = ValidationService.validateExtendedSpotAssignment(303, 'G1', 'A', 7);
            expect(validAssignment.isValid).toBe(true);

            // Apartamento não autorizado NÃO pode receber vaga estendida
            const invalidAssignment = ValidationService.validateExtendedSpotAssignment(101, 'G1', 'A', 7);
            expect(invalidAssignment.isValid).toBe(false);
            expect(invalidAssignment.error).toContain('não pode receber vaga estendida');
        });

        it('deve verificar se vagas estão livres', () => {
            const freeSpot = { occupiedBy: null, blocked: false };
            const occupiedSpot = { occupiedBy: 101, blocked: false };
            const blockedSpot = { occupiedBy: null, blocked: true };

            expect(ValidationService.isSpotFree(freeSpot)).toBe(true);
            expect(ValidationService.isSpotFree(occupiedSpot)).toBe(false);
            expect(ValidationService.isSpotFree(blockedSpot)).toBe(false);
        });
    });

    describe('RandomnessService', () => {
        it('deve gerar números aleatórios determinísticos com a mesma seed', () => {
            const rng1 = new RandomnessService(12345);
            const rng2 = new RandomnessService(12345);

            expect(rng1.random()).toBe(rng2.random());
            expect(rng1.random()).toBe(rng2.random());
        });

        it('deve embaralhar arrays de forma determinística', () => {
            const rng = new RandomnessService(12345);
            const array1 = [1, 2, 3, 4, 5];
            const array2 = [1, 2, 3, 4, 5];

            const shuffled1 = rng.shuffle(array1);
            rng.reset(12345); // Reset para mesma seed
            const shuffled2 = rng.shuffle(array2);

            expect(shuffled1).toEqual(shuffled2);
        });

        it('deve escolher elementos de forma determinística', () => {
            const rng = new RandomnessService(12345);
            const array = ['a', 'b', 'c', 'd', 'e'];

            const pick1 = rng.pick(array);
            rng.reset(12345);
            const pick2 = rng.pick(array);

            expect(pick1).toBe(pick2);
        });
    });

    describe('LotteryService', () => {
        it('deve configurar seed corretamente', () => {
            const seed = 54321;
            lotteryService.setSeed(seed);
            expect(lotteryService.randomService.seed).toBe(seed);
        });

        it('deve executar pré-processamento de reservas duplas', () => {
            const result = lotteryService.preprocessDoubleReservations(mockApartments, mockGarage);
            expect(result.success).toBe(true);
            expect(lotteryService.isPreprocessed).toBe(true);
        });

        it('deve validar estado atual do sorteio', () => {
            // Estado válido
            const validResult = lotteryService.validateCurrentState(mockApartments, mockGarage);
            expect(validResult.isValid).toBe(true);
            expect(validResult.errors).toHaveLength(0);
        });

        it('deve resetar o serviço corretamente', () => {
            lotteryService.preprocessDoubleReservations(mockApartments, mockGarage);
            expect(lotteryService.isPreprocessed).toBe(true);

            lotteryService.reset();
            expect(lotteryService.isPreprocessed).toBe(false);
            expect(Object.keys(lotteryService.reservations)).toHaveLength(0);
        });

        it('deve obter estatísticas corretas', () => {
            const stats = lotteryService.getStatistics(mockApartments, mockGarage);

            expect(stats.eligibleApartments).toBe(3); // Todos os apartamentos são elegíveis
            expect(stats.drawnApartments).toBe(0); // Nenhum foi sorteado ainda
            expect(stats.freeSpots).toBe(3); // Todas as vagas estão livres
        });
    });

    describe('Integração - Detecção de Bug de Vagas Estendidas', () => {
        it('deve detectar atribuições incorretas de vagas estendidas', () => {
            // Simula um apartamento simples que recebeu vaga estendida (BUG!)
            mockApartments[0].sorteado = true;
            mockApartments[0].vagas = ['G1-A7']; // Vaga estendida para apartamento simples
            mockGarage.spots[2].occupiedBy = 101;

            const validation = lotteryService.validateCurrentState(mockApartments, mockGarage);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Apartamento 101 não pode receber vaga estendida 7');
        });

        it('deve permitir vagas estendidas para apartamentos autorizados', () => {
            // Apartamento 303 autorizado recebe vaga estendida (OK!)
            mockApartments[2].sorteado = true;
            mockApartments[2].vagas = ['G1-A7'];
            mockGarage.spots[2].occupiedBy = 303;

            const validation = lotteryService.validateCurrentState(mockApartments, mockGarage);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });
});