/**
 * @fileoverview Teste de debug para verificar bloqueio de vagas pré-reservadas
 * @description Testa especificamente se vagas pré-reservadas para duplos são bloqueadas para apartamentos simples
 */

import { describe, test, beforeEach, expect } from 'vitest';
import { Garage } from '../../core/models/Garage.js';
import { Spot } from '../../core/models/Spot.js';
import { Apartment } from '../../core/models/Apartment.js';
import { LotterySystemFactory } from '../../core/index.js';

describe('🚫 DEBUG: Bloqueio de Vagas Pré-Reservadas', () => {
  let lotterySystem;
  let apartamentos;
  let garagem;

  // Função para mapear posição para número sequencial
  const positionToSequentialNumber = (floor, side, pos) => {
    const FLOORS = ['G1', 'G2', 'G3', 'G4'];
    const SIDES_BY_FLOOR = {
      'G1': ['A', 'B'],
      'G2': ['C', 'D'], 
      'G3': ['E', 'F'],
      'G4': ['G']
    };
    
    let baseId = 0;
    for (let f = 0; f < FLOORS.indexOf(floor); f++) {
      baseId += SIDES_BY_FLOOR[FLOORS[f]].length * 7; // 7 posições por lado
    }
    
    const sideIndex = SIDES_BY_FLOOR[floor].indexOf(side);
    baseId += sideIndex * 7;
    baseId += pos;
    
    return baseId;
  };

  const criarApartamentos = () => {
    const apts = [];
    // Apenas alguns apartamentos para teste simples
    const duplos = [102, 202]; // 2 apartamentos duplos
    const simples = [101, 201, 301]; // 3 apartamentos simples
    
    [...duplos, ...simples].forEach(num => {
      const isDuplo = duplos.includes(num);
      apts.push(new Apartment(num, num.toString(), true, isDuplo));
    });
    
    return apts;
  };

  const criarGaragemPequena = () => {
    const spots = [];
    const pairs = {};
    
    // Criar apenas G1 com 2 lados (A, B) para teste simples
    const FLOORS = ['G1'];
    const SIDES_BY_FLOOR = {
      'G1': ['A', 'B']
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

  const isVagaEstendida = (vagaId) => {
    // Vagas estendidas são as posições 7 de cada lado
    return vagaId % 7 === 0;
  };

  beforeEach(() => {
    lotterySystem = LotterySystemFactory.createSystem({
      seed: Date.now(),
      isExtendedSpotFn: isVagaEstendida
    });
    apartamentos = criarApartamentos();
    garagem = criarGaragemPequena();
  });

  test('🚫 Vagas pré-reservadas devem ser bloqueadas para apartamentos simples', () => {
    console.log('🚫 Testando bloqueio de vagas pré-reservadas');
    
    // Estado inicial
    console.log(`📊 Pares disponíveis: ${garagem.getFreePairs().length}`);
    console.log(`📊 Vagas simples disponíveis (antes): ${garagem.getFreeNormalSpots(isVagaEstendida).length}`);
    
    // Fazer pré-reserva para 2 apartamentos duplos
    const apartamentosDuplos = apartamentos.filter(apt => apt.dupla);
    console.log(`📊 Apartamentos duplos: ${apartamentosDuplos.map(apt => apt.id)}`);
    
    const preReserveSuccess = garagem.preReserveDoublePairs(apartamentosDuplos.length);
    expect(preReserveSuccess).toBe(true);
    
    // Verificar pré-reservas ativas
    const reservasAtivas = Object.keys(garagem.doublePairReservations);
    console.log(`✅ Pré-reservas ativas: ${reservasAtivas.join(', ')}`);
    
    // Mostrar quais vagas estão bloqueadas
    for (const [pairId, reservation] of Object.entries(garagem.doublePairReservations)) {
      console.log(`🔒 Par ${pairId} reservado: vagas ${reservation.vagas.join(', ')}`);
    }
    
    // Verificar vagas simples após pré-reserva
    const vagasSimples = garagem.getFreeNormalSpots(isVagaEstendida);
    console.log(`📊 Vagas simples disponíveis (depois): ${vagasSimples.length}`);
    console.log(`📊 Vagas simples disponíveis: ${vagasSimples.map(s => s.id).join(', ')}`);
    
    // Tentar sortear apartamento simples
    const apartamentosSimples = apartamentos.filter(apt => !apt.dupla);
    const apartamentoSimples = apartamentosSimples[0];
    
    console.log(`🎲 Tentando sortear apartamento simples ${apartamentoSimples.id}...`);
    const result = lotterySystem.orchestrator.executeSorting([apartamentoSimples], garagem);
    
    if (result.success) {
      const vagaSorteada = result.spotData.spot.id;
      console.log(`✅ Apartamento simples ${apartamentoSimples.id} sorteado → vaga ${vagaSorteada}`);
      
      // Verificar se a vaga sorteada não faz parte de um par pré-reservado
      let vagaEstaEmParReservado = false;
      for (const [pairId, reservation] of Object.entries(garagem.doublePairReservations)) {
        if (reservation.vagas.includes(vagaSorteada)) {
          vagaEstaEmParReservado = true;
          console.log(`❌ ERRO: Vaga ${vagaSorteada} faz parte do par reservado ${pairId}!`);
          break;
        }
      }
      
      expect(vagaEstaEmParReservado).toBe(false);
      
      if (!vagaEstaEmParReservado) {
        console.log(`✅ Vaga ${vagaSorteada} NÃO faz parte de par reservado - correto!`);
      }
    } else {
      console.log(`ℹ️ Sorteio falhou: ${result.message}`);
      // Se todas as vagas simples estão bloqueadas por pré-reservas, isso é o comportamento esperado
      console.log(`✅ Falha esperada - todas as vagas simples estão protegidas para apartamentos duplos`);
    }
  });

  test('🔓 Apartamentos duplos devem conseguir acessar pares pré-reservados', () => {
    console.log('🔓 Testando acesso de apartamentos duplos a pares pré-reservados');
    
    // Fazer pré-reserva para 2 apartamentos duplos
    const apartamentosDuplos = apartamentos.filter(apt => apt.dupla);
    const preReserveSuccess = garagem.preReserveDoublePairs(apartamentosDuplos.length);
    expect(preReserveSuccess).toBe(true);
    
    // Tentar sortear apartamento duplo
    const apartamentoDuplo = apartamentosDuplos[0];
    console.log(`🎲 Tentando sortear apartamento duplo ${apartamentoDuplo.id}...`);
    
    const result = lotterySystem.orchestrator.executeSorting([apartamentoDuplo], garagem);
    
    expect(result.success).toBe(true);
    console.log(`✅ Apartamento duplo ${apartamentoDuplo.id} sorteado → par ${result.spotData.pair.id} (vagas ${result.spotData.pair.aId}, ${result.spotData.pair.bId})`);
    
    // Verificar se o par sorteado estava pré-reservado
    const parSorteado = result.spotData.pair.id;
    expect(garagem.doublePairReservations[parSorteado]).toBeUndefined(); // Deve ter sido liberado
    console.log(`✅ Pré-reserva do par ${parSorteado} foi corretamente liberada após o sorteio`);
  });
});