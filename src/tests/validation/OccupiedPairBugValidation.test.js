import { describe, test, expect, beforeEach } from 'vitest';
import { LotterySystemFactory } from '../../core/index.js';
import { Apartment } from '../../core/models/Apartment.js';
import { Garage } from '../../core/models/Garage.js';
import { Spot } from '../../core/models/Spot.js';

describe('🐛 CENÁRIO BUG: Par ocupado sendo sorteado novamente', () => {
  let lotterySystem;
  let apartamentos;
  let garagem;
  
  // Simular função de vagas estendidas baseada nos logs
  const isVagaEstendida = (vagaId) => [7, 8, 21, 22, 35, 36].includes(vagaId);
  
  // Função para converter posição para número sequencial
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
    const pairs = {};
    
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
          
          pairs[parId] = {
            id: parId,
            aId,
            bId,
            floor,
            side,
            reservedFor: null
          };
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

  test('🐛 BUG REPORT: Par G2-D-3-4 sendo sorteado após vaga 24 estar ocupada', () => {
    console.log('🔍 Investigando bug: Par sendo sorteado mesmo com vagas ocupadas');
    
    // Simular o cenário dos logs: vaga 24 está ocupada pelo apartamento 402
    const vaga23 = garagem.spots.find(s => s.id === 23);
    const vaga24 = garagem.spots.find(s => s.id === 24);
    
    console.log('📋 Vaga 23 antes da ocupação:', {
      id: vaga23.id,
      occupiedBy: vaga23.occupiedBy,
      isFree: vaga23.isFree()
    });
    
    console.log('📋 Vaga 24 antes da ocupação:', {
      id: vaga24.id,
      occupiedBy: vaga24.occupiedBy,
      isFree: vaga24.isFree()
    });
    
    // Ocupar as vagas 23 e 24 (par G2-D-3-4) pelo apartamento 402
    vaga23.occupiedBy = 402;
    vaga24.occupiedBy = 402;
    
    console.log('📋 Vaga 23 após ocupação:', {
      id: vaga23.id,
      occupiedBy: vaga23.occupiedBy,
      isFree: vaga23.isFree()
    });
    
    console.log('📋 Vaga 24 após ocupação:', {
      id: vaga24.id,
      occupiedBy: vaga24.occupiedBy,
      isFree: vaga24.isFree()
    });
    
    // Verificar par G2-D-3-4
    const parG2D34 = garagem.pairs['G2-D-3-4'];
    console.log('📋 Par G2-D-3-4:', {
      id: parG2D34.id,
      aId: parG2D34.aId,
      bId: parG2D34.bId,
      reservedFor: parG2D34.reservedFor
    });
    
    // Confirmar que vagas 24 e 25 fazem parte do par
    expect(parG2D34.aId).toBe(23); // G2-D posição 3 = 22+1 = 23
    expect(parG2D34.bId).toBe(24); // G2-D posição 4 = 22+2 = 24
    
    // As vagas devem estar ocupadas
    expect(vaga23.isFree()).toBe(false);
    expect(vaga24.isFree()).toBe(false);
    
    // ANTES DA CORREÇÃO: getFreePairs() retornaria este par incorretamente
    console.log('🔍 Testando função getFreePairs()...');
    const paresLivres = garagem.getFreePairs();
    console.log(`📊 Pares livres encontrados: ${paresLivres.length}`);
    
    // O par G2-D-3-4 NÃO deve estar na lista de pares livres
    const parG2D34NaLista = paresLivres.find(p => p.id === 'G2-D-3-4');
    expect(parG2D34NaLista).toBeUndefined();
    
    console.log('✅ Par G2-D-3-4 corretamente excluído dos pares livres');
    
    // Verificar que outros pares estão disponíveis
    const outrosPares = paresLivres.filter(p => p.id !== 'G2-D-3-4');
    console.log(`📊 Outros pares disponíveis: ${outrosPares.length}`);
    
    expect(outrosPares.length).toBeGreaterThan(0);
    
    // Tentar sortear apartamento duplo
    const apartamentosDuplos = apartamentos.filter(apt => apt.dupla && apt.isAvailableForDraw());
    console.log(`📊 Apartamentos duplos disponíveis: ${apartamentosDuplos.length}`);
    
    const apt604 = apartamentosDuplos.find(apt => apt.id === 604);
    if (apt604) {
      console.log('🎲 Testando sorteio para apartamento 604 (duplo)...');
      
      const result = lotterySystem.orchestrator.executeSorting([apt604], garagem);
      
      console.log('📊 Resultado do sorteio:', {
        success: result.success,
        message: result.message,
        spotType: result.spotData?.type,
        parId: result.spotData?.pair?.id
      });
      
      if (result.success) {
        // Se bem-sucedido, não deve ser o par G2-D-3-4
        expect(result.spotData.pair.id).not.toBe('G2-D-3-4');
        console.log('✅ Sorteio bem-sucedido com par diferente de G2-D-3-4');
      } else {
        // Se falhou, não deve ser por "vaga não está livre" do par G2-D-3-4
        expect(result.message).not.toContain('Vaga A do par G2-D-3-4');
        console.log('✅ Falha não é relacionada ao par G2-D-3-4 ocupado');
      }
    }
  });

  test('🔧 VALIDAÇÃO: Pares ocupados não devem ser sorteados', () => {
    console.log('🔧 Testando se pares ocupados são corretamente filtrados');
    
    // Ocupar algumas vagas para tornar alguns pares indisponíveis
    const vaga1 = garagem.spots.find(s => s.id === 1);
    const vaga2 = garagem.spots.find(s => s.id === 2);
    const vaga8 = garagem.spots.find(s => s.id === 8); // G1-B posição 1
    
    // Ocupar par G1-A-1-2 (vagas 1, 2)
    vaga1.occupiedBy = 999;
    vaga2.occupiedBy = 999;
    
    // Ocupar apenas uma vaga do par G1-B-1-2 (vaga 8)
    vaga8.occupiedBy = 888;
    
    console.log('📋 Vagas ocupadas:');
    console.log('  - Vaga 1: ocupada por 999');
    console.log('  - Vaga 2: ocupada por 999'); 
    console.log('  - Vaga 8: ocupada por 888');
    
    // Verificar pares livres
    const paresLivres = garagem.getFreePairs();
    console.log(`📊 Total de pares livres: ${paresLivres.length}`);
    
    // Par G1-A-1-2 não deve estar disponível (ambas vagas ocupadas)
    const parG1A12 = paresLivres.find(p => p.aId === 1 && p.bId === 2);
    expect(parG1A12).toBeUndefined();
    console.log('✅ Par G1-A-1-2 corretamente excluído (ambas vagas ocupadas)');
    
    // Par G1-B-1-2 não deve estar disponível (vaga 8 ocupada)
    const parG1B12 = paresLivres.find(p => p.aId === 8 || p.bId === 8);
    expect(parG1B12).toBeUndefined();
    console.log('✅ Par contendo vaga 8 corretamente excluído (uma vaga ocupada)');
    
    // Deve ainda haver outros pares livres
    expect(paresLivres.length).toBeGreaterThan(0);
    console.log(`✅ ${paresLivres.length} outros pares ainda disponíveis`);
    
    console.log('✅ VALIDAÇÃO CONCLUÍDA: Sistema funciona corretamente!');
  });
});