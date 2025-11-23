import { describe, test, expect, beforeEach } from 'vitest';
import { LotterySystemFactory } from '../../core/index.js';
import { Apartment } from '../../core/models/Apartment.js';
import { Garage } from '../../core/models/Garage.js';
import { Spot } from '../../core/models/Spot.js';

describe('🐛 CENÁRIO BUG: Vaga não está livre no primeiro sorteio', () => {
    let lotterySystem;
    let apartamentos;
    let garagem;

    // Simular função de vagas estendidas baseada nos logs
    const isVagaEstendida = (vagaId) => [7, 8, 21, 22, 35, 36].includes(vagaId);

    // Função para converter posição para número sequencial (baseada nos logs)
    const positionToSequentialNumber = (floor, side, pos) => {
        const floorOffsets = { 'G1': 0, 'G2': 14, 'G3': 28, 'G4': 42 };
        const sideOffsets = { 'A': 0, 'B': 2, 'C': 4, 'D': 6, 'E': 8, 'F': 10, 'G': 12 };
        return floorOffsets[floor] + sideOffsets[side] + pos;
    };

    // Criar apartamentos conforme configuração dos logs
    const criarApartamentos = () => {
        const apts = [];

        // Apartamentos duplos: [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702]
        const duplos = [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702];
        // Apartamentos estendidos: [303, 403, 503, 603, 703]
        const estendidos = [303, 403, 503, 603, 703];

        // Criar todos os apartamentos de 1-7 andares, 4 por andar
        for (let andar = 1; andar <= 7; andar++) {
            for (let col = 1; col <= 4; col++) {
                const num = parseInt(`${andar}0${col}`);
                const isDuplo = duplos.includes(num);
                const isEstendido = estendidos.includes(num);

                apts.push(new Apartment(num, num.toString(), true, isDuplo));
            }
        }

        return apts;
    };

    // Criar garagem conforme estrutura UI
    const criarGaragem = () => {
        const spots = [];
        const pairs = [];

        // Simular criação de vagas como no código real
        const FLOORS = ['G1', 'G2', 'G3', 'G4'];
        const SIDES_BY_FLOOR = {
            'G1': ['A', 'B'],
            'G2': ['C', 'D'],
            'G3': ['E', 'F'],
            'G4': ['G']
        };
        const POSITIONS = [1, 2, 3, 4, 5, 6, 7];
        const NATURAL_PAIRS = [[1, 2], [3, 4], [5, 6]];

        for (const floor of FLOORS) {
            for (const side of SIDES_BY_FLOOR[floor]) {
                // Criar pares primeiro
                for (const [p1, p2] of NATURAL_PAIRS) {
                    const parId = `${floor}-${side}-${p1}-${p2}`;
                    const aId = positionToSequentialNumber(floor, side, p1);
                    const bId = positionToSequentialNumber(floor, side, p2);

                    pairs.push({
                        id: parId,
                        aId,
                        bId,
                        floor,
                        side,
                        isOccupied: false
                    });
                }

                // Criar spots
                for (const pos of POSITIONS) {
                    const vagaId = positionToSequentialNumber(floor, side, pos);
                    const naturalPair = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
                    const [p1, p2] = naturalPair || [pos, pos];

                    const spot = new Spot(vagaId, floor, side, pos, 'VAGA');
                    spot.blocked = false;
                    spot.occupiedBy = null;
                    spot.parId = `${floor}-${side}-${p1}-${p2}`;

                    spots.push(spot);
                }
            }
        }

        return new Garage(spots, pairs);
    };

    beforeEach(() => {
        lotterySystem = LotterySystemFactory.createSystem({
            seed: Date.now(),
            isExtendedSpotFn: isVagaEstendida
        });
        apartamentos = criarApartamentos();
        garagem = criarGaragem();
    });

    test('🐛 BUG REPORT: Vaga 24 não está livre no primeiro sorteio', () => {
        console.log('🔍 Investigando bug: "Vaga A do par G2-D-3-4: Vaga 24 não está livre"');

        // Verificar estado inicial da vaga 24
        const vaga24 = garagem.spots.find(s => s.id === 24);
        console.log('📋 Vaga 24 estado inicial:', {
            id: vaga24.id,
            floor: vaga24.floor,
            side: vaga24.side,
            pos: vaga24.pos,
            blocked: vaga24.blocked,
            occupiedBy: vaga24.occupiedBy,
            isFree: vaga24.isFree(),
            type: vaga24.type
        });

        // A vaga deve estar livre inicialmente
        expect(vaga24.isFree()).toBe(true);
        expect(vaga24.occupiedBy).toBeNull();
        expect(vaga24.blocked).toBe(false);

        // Verificar par G2-D-3-4 (que contém vaga 24)
        const parG2D34 = garagem.pairs.find(p => p.id === 'G2-D-3-4');
        console.log('📋 Par G2-D-3-4:', parG2D34);

        // Confirmar que vaga 24 faz parte do par
        expect([parG2D34.aId, parG2D34.bId]).toContain(24);

        // Verificar se apartamento 402 está disponível
        const apt402 = apartamentos.find(a => a.id === 402);
        console.log('📋 Apartamento 402:', {
            id: apt402.id,
            dupla: apt402.dupla,
            isAvailableForDraw: apt402.isAvailableForDraw(),
            isExtended: apt402.isExtended ? apt402.isExtended(isVagaEstendida) : 'N/A'
        });

        // 402 deve ser apartamento duplo
        expect(apt402.dupla).toBe(true);
        expect(apt402.isAvailableForDraw()).toBe(true);

        // Executar sorteio
        console.log('🎲 Executando sorteio...');
        const result = lotterySystem.orchestrator.executeSorting(apartamentos, garagem);

        console.log('📊 Resultado do sorteio:', {
            success: result.success,
            message: result.message,
            apartmentId: result.apartment?.id,
            spotType: result.spotData?.type
        });

        // Se houver erro, investigar mais
        if (!result.success) {
            console.log('❌ Erro detalhado:', result.message);

            // Verificar se o erro é relacionado à vaga 24
            if (result.message.includes('Vaga 24')) {
                console.log('🔍 Investigando vaga 24 no momento do erro...');

                // Re-verificar vaga 24
                const vaga24Final = garagem.spots.find(s => s.id === 24);
                console.log('📋 Vaga 24 no momento do erro:', {
                    id: vaga24Final.id,
                    blocked: vaga24Final.blocked,
                    occupiedBy: vaga24Final.occupiedBy,
                    isFree: vaga24Final.isFree(),
                    type: vaga24Final.type
                });

                // Verificar todos os pares disponíveis para apartamentos duplos
                const availablePairs = garagem.getFilteredFreePairs(isVagaEstendida);
                console.log('📋 Pares disponíveis:', availablePairs.length);
                console.log('📋 Primeiro par:', availablePairs[0]);

                // Este teste deve falhar para demonstrar o bug
                expect(result.success).toBe(true); // Isso vai falhar e mostrar o erro
            }
        } else {
            console.log('✅ Sorteio executado com sucesso');
            expect(result.success).toBe(true);
        }
    });

    test('🔧 FIX VALIDATION: Verificar se correção resolve o problema', () => {
        console.log('🔧 Testando se correção da conversão resolve o problema');

        // Simular conversão UI -> SOLID como estava antes (buggy)
        const convertToSolidGarageBuggy = (uiGarage) => {
            const solidSpots = uiGarage.spots.map(spot => new Spot(
                spot.id,
                spot.floor,
                spot.side,
                spot.pos,
                spot.blocked || false,  // BUG: blocked sendo passado como 5º parâmetro (type)
                spot.occupiedBy || null,
                spot.parId || null
            ));
            return new Garage(solidSpots, uiGarage.pairs);
        };

        // Simular conversão UI -> SOLID corrigida
        const convertToSolidGarageFixed = (uiGarage) => {
            const solidSpots = uiGarage.spots.map(spot => {
                const solidSpot = new Spot(spot.id, spot.floor, spot.side, spot.pos, 'VAGA');
                solidSpot.blocked = spot.blocked || false;
                solidSpot.occupiedBy = spot.occupiedBy || null;
                solidSpot.parId = spot.parId || null;
                return solidSpot;
            });
            return new Garage(solidSpots, uiGarage.pairs);
        };

        // Criar garagem UI simulada
        const uiGaragem = {
            spots: garagem.spots.map(s => ({
                id: s.id,
                floor: s.floor,
                side: s.side,
                pos: s.pos,
                blocked: false,
                occupiedBy: null,
                parId: s.parId
            })),
            pairs: garagem.pairs
        };

        // Testar conversão buggy
        const garagemBuggy = convertToSolidGarageBuggy(uiGaragem);
        const vaga24Buggy = garagemBuggy.spots.find(s => s.id === 24);
        console.log('🐛 Vaga 24 com conversão buggy:', {
            type: vaga24Buggy.type,
            blocked: vaga24Buggy.blocked,
            isFree: vaga24Buggy.isFree()
        });

        // Testar conversão corrigida
        const garagemFixed = convertToSolidGarageFixed(uiGaragem);
        const vaga24Fixed = garagemFixed.spots.find(s => s.id === 24);
        console.log('✅ Vaga 24 com conversão corrigida:', {
            type: vaga24Fixed.type,
            blocked: vaga24Fixed.blocked,
            isFree: vaga24Fixed.isFree()
        });

        // A conversão buggy pode causar problemas
        console.log('📊 Comparação:');
        console.log('  Buggy isFree:', vaga24Buggy.isFree());
        console.log('  Fixed isFree:', vaga24Fixed.isFree());

        // A versão corrigida deve funcionar
        expect(vaga24Fixed.isFree()).toBe(true);
        expect(vaga24Fixed.type).toBe('VAGA');
    });
});