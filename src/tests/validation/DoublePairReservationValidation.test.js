/**
 * @fileoverview Teste para validação do sistema de pré-reserva de pares duplos
 * @description Verifica se o sistema pré-reserva corretamente pares para apartamentos duplos,
 * evitando o erro "Nenhuma vaga disponível para apartamento duplo"
 */

import { describe, test, beforeEach, expect } from 'vitest';
import { Garage } from '../../core/models/Garage.js';
import { Spot } from '../../core/models/Spot.js';
import { Apartment } from '../../core/models/Apartment.js';
import { LotterySystemFactory } from '../../core/index.js';

describe('🎯 VALIDAÇÃO: Sistema de Pré-Reserva para Apartamentos Duplos', () => {
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
    const duplos = [102, 202, 301, 401, 502, 602, 702]; // 7 apartamentos duplos
    const estendidos = [103, 203, 303, 403, 503, 603, 703];
    
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
    garagem = criarGaragem();
  });

  test('🔧 PRÉ-RESERVA: Deve reservar pares suficientes para apartamentos duplos', () => {
    console.log('🔧 Testando sistema de pré-reserva de pares duplos');
    
    // Contar apartamentos duplos
    const apartamentosDuplos = apartamentos.filter(apt => apt.dupla && apt.isAvailableForDraw());
    console.log(`📊 Apartamentos duplos encontrados: ${apartamentosDuplos.length}`);
    
    // Verificar pares disponíveis antes da pré-reserva
    const paresLivresAntes = garagem.getFreePairs().length;
    console.log(`📊 Pares livres antes da pré-reserva: ${paresLivresAntes}`);
    
    // Fazer pré-reserva
    const preReserveSuccess = garagem.preReserveDoublePairs(apartamentosDuplos.length);
    
    expect(preReserveSuccess).toBe(true);
    console.log('✅ Pré-reserva realizada com sucesso');
    
    // Verificar se pré-reservas foram criadas
    const reservasAtivas = Object.keys(garagem.doublePairReservations).length;
    expect(reservasAtivas).toBe(apartamentosDuplos.length);
    console.log(`✅ ${reservasAtivas} pré-reservas ativas para apartamentos duplos`);
    
    // Verificar se pares pré-reservados não estão disponíveis para apartamentos simples
    const paresLivresParaSimples = garagem.getAvailablePairsForDoubleApartments(false);
    expect(paresLivresParaSimples.length).toBe(paresLivresAntes - apartamentosDuplos.length);
    console.log(`✅ Pares para apartamentos simples reduzidos de ${paresLivresAntes} para ${paresLivresParaSimples.length}`);
    
    // Verificar se pares pré-reservados estão disponíveis para apartamentos duplos
    const paresLivresParaDuplos = garagem.getAvailablePairsForDoubleApartments(true);
    expect(paresLivresParaDuplos.length).toBe(paresLivresAntes);
    console.log(`✅ Apartamentos duplos ainda podem acessar todos os ${paresLivresParaDuplos.length} pares`);
  });

  test('🎯 CENÁRIO REAL: Múltiplos sorteios não devem esgotar pares para duplos', () => {
    console.log('🎯 Simulando cenário real de múltiplos sorteios');
    
    const apartamentosDuplos = apartamentos.filter(apt => apt.dupla && apt.isAvailableForDraw());
    const apartamentosSimples = apartamentos.filter(apt => !apt.dupla && apt.isAvailableForDraw());
    
    console.log(`📊 ${apartamentosDuplos.length} apartamentos duplos, ${apartamentosSimples.length} apartamentos simples`);
    
    // Fazer pré-reserva para apartamentos duplos
    const preReserveSuccess = garagem.preReserveDoublePairs(apartamentosDuplos.length);
    expect(preReserveSuccess).toBe(true);
    console.log('✅ Pré-reserva inicial bem-sucedida');
    
    let sorteiosRealizados = 0;
    let sorteiosDuplos = 0;
    let sorteiosSimples = 0;
    
    // Simular 15 sorteios (mais que apartamentos duplos)
    for (let i = 0; i < 15; i++) {
      const apartamentosDisponiveis = apartamentos.filter(apt => apt.isAvailableForDraw());
      
      if (apartamentosDisponiveis.length === 0) {
        console.log(`🛑 Nenhum apartamento disponível após ${sorteiosRealizados} sorteios`);
        break;
      }
      
      const result = lotterySystem.orchestrator.executeSorting(apartamentosDisponiveis, garagem);
      
      if (result.success) {
        const isDuplo = result.apartment.dupla;
        const vagasUsadas = result.spotData.type === 'double'
          ? [result.spotData.pair.aId, result.spotData.pair.bId]
          : [result.spotData.spot.id];
        
        // Atualizar garagem
        garagem = result.assignmentResult.garage;
        
        // Marcar apartamento como sorteado
        const apartamento = apartamentos.find(apt => apt.id === result.apartment.id);
        apartamento.sorteado = true;
        
        sorteiosRealizados++;
        if (isDuplo) {
          sorteiosDuplos++;
        } else {
          sorteiosSimples++;
        }
        
        console.log(`✅ Sorteio ${sorteiosRealizados}: Apartamento ${result.apartment.id} (${isDuplo ? 'duplo' : 'simples'}) → Vagas ${vagasUsadas.join(', ')}`);
      } else {
        console.log(`❌ Sorteio ${i + 1} falhou: ${result.message}`);
        
        // Se falhou para apartamento duplo, não deveria ter acontecido
        const apartamentosDisponiveis = apartamentos.filter(apt => apt.isAvailableForDraw());
        const duploDisponiveis = apartamentosDisponiveis.filter(apt => apt.dupla);
        
        if (duploDisponiveis.length > 0 && result.message.includes('Nenhuma vaga disponível para apartamento duplo')) {
          throw new Error(`Sistema falhou para apartamento duplo mesmo com pré-reserva! ${result.message}`);
        }
        
        break;
      }
    }
    
    console.log(`📊 Resumo: ${sorteiosRealizados} sorteios (${sorteiosDuplos} duplos, ${sorteiosSimples} simples)`);
    
    // Todos os sorteios duplos que aconteceram devem ter sido bem-sucedidos
    expect(sorteiosDuplos).toBeGreaterThan(0);
    console.log(`✅ ${sorteiosDuplos} apartamentos duplos foram sorteados com sucesso`);
    
    // Nenhuma pré-reserva para apartamentos duplos já sorteados deve restar ativa
    const reservasRestantes = Object.keys(garagem.doublePairReservations).length;
    const duplosPendentes = apartamentosDuplos.length - sorteiosDuplos;
    expect(reservasRestantes).toBe(duplosPendentes);
    console.log(`✅ ${reservasRestantes} pré-reservas restantes para ${duplosPendentes} apartamentos duplos pendentes`);
  });

  test('🚫 VALIDAÇÃO: Falha quando não há pares suficientes', () => {
    console.log('🚫 Testando cenário com pares insuficientes');
    
    // Ocupar muitos pares para simular escassez
    const pares = Object.values(garagem.pairs);
    const parasOcupar = pares.slice(0, 15); // Ocupar 15 dos 21 pares disponíveis
    
    parasOcupar.forEach(pair => {
      garagem.occupySpot(pair.aId, 999);
      garagem.occupySpot(pair.bId, 999);
    });
    
    console.log(`📊 ${parasOcupar.length} pares ocupados artificialmente`);
    
    const paresLivresRestantes = garagem.getFreePairs().length;
    console.log(`📊 ${paresLivresRestantes} pares ainda livres`);
    
    // Tentar pré-reservar mais pares que os disponíveis
    const apartamentosDuplos = apartamentos.filter(apt => apt.dupla && apt.isAvailableForDraw());
    const preReserveSuccess = garagem.preReserveDoublePairs(apartamentosDuplos.length);
    
    if (paresLivresRestantes < apartamentosDuplos.length) {
      expect(preReserveSuccess).toBe(false);
      console.log(`✅ Sistema corretamente rejeitou pré-reserva (${paresLivresRestantes} disponíveis, ${apartamentosDuplos.length} necessários)`);
    } else {
      expect(preReserveSuccess).toBe(true);
      console.log(`✅ Sistema conseguiu pré-reservar ${apartamentosDuplos.length} pares`);
    }
  });
});