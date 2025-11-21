import React, { useRef, useState, useEffect } from "react";
import { 
  apartamentoTemDireitoDupla, 
  positionToSequentialNumber,
  getExclusiveApartmentType,
  validateConfigExclusivity,
  loadConfigFromFile,
  isVagaExtendida
} from "./config/sorteioConfig.js";/* ===== Aleatoriedade ===== */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ===== Converte ID da vaga para número sequencial ===== */
function vagaIdToSequentialNumber(vagaId) {
  // vagaId formato: "G1-A1", "G1-A2", etc.
  const match = vagaId.match(/^(G\d+)-([A-F])(\d+)$/);
  if (!match) return vagaId; // fallback se não conseguir converter

  const floor = match[1];
  const side = match[2];
  const position = Number.parseInt(match[3]);

  return positionToSequentialNumber(floor, side, position);
}

/* ===== Configuração ===== */
const FLOORS = ["G1", "G2", "G3"];
const SIDES_BY_FLOOR = { G1: ["A", "B"], G2: ["C", "D"], G3: ["E", "F"] };
const POSITIONS = [1, 2, 3, 4, 5, 6, 7];
const NATURAL_PAIRS = [
  [1, 2],
  [3, 4],
  [5, 6],
];

/* ===== Paleta: estados das vagas ===== */
const COLORS = {
  free: "#16a34a",      // verde (livre)
  extended: "#f97316",  // laranja (vaga extendida)
  selected: "#60a5fa",  // azul claro (escolhida/ocupada)
  // reserved: "#facc15",  // (não mostrar mais)
  blocked: "#475569",   // cinza (bloqueada)
  base: "#1f2937"       // default
};



/* ===== Modelo garagem ===== */
function buildInitialGarage() {
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

/* ===== Lista de apartamentos: 4 por andar, 7 andares (1..7) ===== */
function buildInitialApartments() {
  const list = [];
  for (let andar = 1; andar <= 7; andar++) {
    for (let col = 1; col <= 4; col++) {
      const num = parseInt(`${andar}0${col}`); // 101..104, 201..204, ..., 701..704
      const temDireitoDupla = apartamentoTemDireitoDupla(num);
      list.push({
        id: num,
        dupla: temDireitoDupla,
        sorteado: false,
        vagas: [],
        ativo: true
      });
    }
  }
  return list;
}

/* ===== Componente principal ===== */
export default function GarageLotteryApp() {
  /* Estado */
  const [seed, setSeed] = useState(12345);
  const [configLoaded, setConfigLoaded] = useState(false);
  const rng = useRef(mulberry32(12345));
  const [compact, setCompact] = useState(true); // densidade de layout
  const [garage, setGarage] = useState(buildInitialGarage());
  const [apartments, setApartments] = useState([]);  // Inicia vazio, será preenchido após carregar config

  /* Carregamento da configuração */
  useEffect(() => {
    const loadConfig = async () => {
      console.log('🔄 Tentando carregar configuração do arquivo...');
      const loaded = await loadConfigFromFile();
      if (loaded) {
        console.log('✅ Configuração carregada com sucesso!');
      } else {
        console.log('⚠️ Usando configuração padrão (hardcoded)');
      }
      
      // Sempre inicializa os apartamentos após tentar carregar a config
      console.log('🏢 Inicializando apartamentos...');
      setApartments(buildInitialApartments());
      setConfigLoaded(true);
    };
    
    loadConfig();
  }, []);

  /* Validação da configuração */
  const configValidation = validateConfigExclusivity();
  if (!configValidation.isValid) {
    console.warn('⚠️ Problemas na configuração detectados:', configValidation.errors);
  }
  const [doubleReservations, setDoubleReservations] = useState(null); // aptId -> parId
  const [preprocessed, setPreprocessed] = useState(false);
  const [lastDraw, setLastDraw] = useState(null); // { aptId, vagas }


  /* Helpers */
  const log = (...a) => console.log("[Sorteio]", ...a);
  const resetRng = (s) => (rng.current = mulberry32(Number(s) || 0));
  const pick = (arr) =>
    !arr.length ? null : arr[Math.floor(rng.current() * arr.length)];

  const getFreePairs = (state) => {
    const free = [];
    for (const id in state.pairs) {
      const p = state.pairs[id];
      const a = state.spots.find((s) => s.id === p.aId);
      const b = state.spots.find((s) => s.id === p.bId);
      
      // Converte IDs das vagas para números sequenciais para verificar se são extendidas
      const vagaNumA = positionToSequentialNumber(a.floor, a.side, a.pos);
      const vagaNumB = positionToSequentialNumber(b.floor, b.side, b.pos);
      
      // ❌ EXCLUSÃO: Pares que contenham vagas extendidas (laranja) não podem ser usados para duplas
      if (isVagaExtendida(vagaNumA) || isVagaExtendida(vagaNumB)) {
        console.log(`🚫 Par ${p.id} (vagas ${vagaNumA}, ${vagaNumB}) excluído - contém vaga(s) extendida(s)`);
        continue;
      }
      
      if (!a.occupiedBy && !b.occupiedBy && !a.blocked && !b.blocked) free.push(p);
    }
    return free;
  };
  const countByRegion = (state) => {
    const m = new Map();
    for (const f of FLOORS) for (const s of SIDES_BY_FLOOR[f]) m.set(`${f}-${s}`, 0);
    for (const sp of state.spots)
      if (sp.occupiedBy)
        m.set(
          `${sp.floor}-${sp.side}`,
          (m.get(`${sp.floor}-${sp.side}`) || 0) + 1
        );
    return m;
  };
  const chooseBalancedPair = (pairsList, state) => {
    if (pairsList.length <= 1) return pick(pairsList);
    const rc = countByRegion(state);
    const min = Math.min(
      ...pairsList.map((p) => rc.get(`${p.floor}-${p.side}`) || 0)
    );
    return pick(pairsList.filter((p) => (rc.get(`${p.floor}-${p.side}`) || 0) === min));
  };
  const chooseBalancedSpot = (spotsList, state) => {
    if (spotsList.length <= 1) return pick(spotsList);
    const rc = countByRegion(state);
    const min = Math.min(
      ...spotsList.map((s) => rc.get(`${s.floor}-${s.side}`) || 0)
    );
    return pick(spotsList.filter((s) => (rc.get(`${s.floor}-${s.side}`) || 0) === min));
  };

  /* Pré-processo oculto de duplas (apenas apartamentos ativos e marcados como dupla).
     As reservas são balanceadas por região e NÃO aparecem visualmente (apenas em log).
  */
  const runPreprocessIfNeeded = () => {
    if (preprocessed && doubleReservations) return;
    const state = structuredClone({ spots: garage.spots, pairs: garage.pairs });
    const duplos = apartments.filter((a) => a.dupla && a.ativo).map((a) => a.id);
    const freePairs = getFreePairs(state);
    if (duplos.length > freePairs.length) {
      alert(
        `Não há pares suficientes: duplas=${duplos.length}, pares livres=${freePairs.length}`
      );
      return;
    }
    const order = seededShuffle(duplos, rng.current);
    const reservations = {};
    for (const aptId of order) {
      const free = getFreePairs(state);
      if (!free.length) break;
      const chosen = chooseBalancedPair(free, state);
      reservations[aptId] = chosen.id;
      // Marca internamente no snapshot só para impedir reuso no balanceamento deste loop
      state.spots.find((s) => s.id === chosen.aId).occupiedBy = `RESERVA-${aptId}`;
      state.spots.find((s) => s.id === chosen.bId).occupiedBy = `RESERVA-${aptId}`;
      log("Pré-processo: reservado par", chosen.id, "para apto", aptId);
    }
    // Restaura snapshot (sem ocupação visual)
    const restored = state.spots.map((s) => ({ ...s, occupiedBy: null }));
    const newPairs = { ...garage.pairs };
    for (const aptId in reservations)
      newPairs[reservations[aptId]] = {
        ...newPairs[reservations[aptId]],
        reservedFor: aptId, // apenas flag interna
      };
    setGarage((prev) => ({ spots: restored, pairs: newPairs }));
    setDoubleReservations(reservations);
    setPreprocessed(true);
  };

  /* Sorteio (1 por clique) */
  const drawOne = () => {
    runPreprocessIfNeeded();

    const pend = apartments.filter((a) => a.ativo && !a.sorteado);
    if (!pend.length) return alert("Todos os apartamentos participantes foram sorteados.");

    const apt = pick(pend);

    if (apt.dupla) {
      const parId = doubleReservations?.[apt.id];
      setGarage((prev) => {
        // escolhe sempre com base no estado atual
        let pair = parId ? prev.pairs[parId] : pick(getFreePairs(prev));
        if (!pair) {
          alert(`Sem par livre para ${apt.id}`);
          return prev;
        }

        // revalida se as vagas estão realmente livres
        const spotA = prev.spots.find((s) => s.id === pair.aId);
        const spotB = prev.spots.find((s) => s.id === pair.bId);
        if (spotA.occupiedBy || spotB.occupiedBy) {
          // já ocupadas -> tenta outro par livre
          const livres = getFreePairs(prev);
          if (!livres.length) {
            alert(`Sem par livre para ${apt.id}`);
            return prev;
          }
          pair = pick(livres);
        }

        const updatedSpots = prev.spots.map((s) =>
          s.id === pair.aId || s.id === pair.bId ? { ...s, occupiedBy: apt.id } : s
        );
        const updatedPairs = { ...prev.pairs };
        if (updatedPairs[pair.id]?.reservedFor === apt.id) updatedPairs[pair.id].reservedFor = null;

        // atualiza também os apartamentos
        setApartments((prevApts) =>
          prevApts.map((a) =>
            a.id === apt.id ? { ...a, sorteado: true, vagas: [pair.aId, pair.bId] } : a
          )
        );
        setLastDraw({ aptId: apt.id, vagas: [pair.aId, pair.bId] });



        return { spots: updatedSpots, pairs: updatedPairs };
      });
    } else {
      setGarage((prev) => {
        // lista atual de vagas livres, sem reservas e não ocupadas
        const allFree = prev.spots.filter(
          (s) =>
            !s.blocked &&
            !s.occupiedBy &&
            !prev.pairs[s.parId]?.reservedFor
        );
        if (!allFree.length) {
          alert("Sem vaga disponível.");
          return prev;
        }

        // 🎯 PRIORIZAÇÃO: Apartamentos simples preferem vagas normais
        // Só usam vagas extendidas se não houver vagas normais disponíveis
        const normalFree = allFree.filter(s => {
          const vagaNum = positionToSequentialNumber(s.floor, s.side, s.pos);
          return !isVagaExtendida(vagaNum);
        });
        
        const extendedFree = allFree.filter(s => {
          const vagaNum = positionToSequentialNumber(s.floor, s.side, s.pos);
          return isVagaExtendida(vagaNum);
        });

        let chosenSpot = null;
        
        // Primeiro tenta vagas normais
        if (normalFree.length > 0) {
          chosenSpot = chooseBalancedSpot(normalFree, prev);
          console.log(`✅ Apartamento ${apt.id} recebeu vaga normal ${positionToSequentialNumber(chosenSpot.floor, chosenSpot.side, chosenSpot.pos)}`);
        } else if (extendedFree.length > 0) {
          // Só usa vaga extendida se não houver vagas normais
          chosenSpot = chooseBalancedSpot(extendedFree, prev);
          const vagaNum = positionToSequentialNumber(chosenSpot.floor, chosenSpot.side, chosenSpot.pos);
          console.log(`🟠 Apartamento ${apt.id} recebeu vaga estendida ${vagaNum} (não havia vagas normais disponíveis)`);
        }

        if (!chosenSpot) {
          alert("Sem vaga disponível.");
          return prev;
        }

        const updatedSpots = prev.spots.map((s) =>
          s.id === chosenSpot.id ? { ...s, occupiedBy: apt.id } : s
        );

        setApartments((prevApts) =>
          prevApts.map((a) =>
            a.id === apt.id ? { ...a, sorteado: true, vagas: [chosenSpot.id] } : a
          )
        );
        setLastDraw({ aptId: apt.id, vagas: [chosenSpot.id] });

        return { ...prev, spots: updatedSpots };
      });
    }
  };


  /* Reset */
  const clearAll = () => {
    setGarage(buildInitialGarage());
    setDoubleReservations(null);
    setPreprocessed(false);
    setApartments(buildInitialApartments());
    setLastDraw(null);
  };

  /* Função para revalidar e sincronizar estados */
  const revalidateStates = () => {
    console.log('🔄 Revalidando estados...');
    
    // Reconstroi completamente os estados
    const newGarage = buildInitialGarage();
    const newApartments = buildInitialApartments();
    
    // Aplica novamente todos os sorteios válidos baseado nos apartamentos atuais
    const sortedApartments = apartments.filter(a => a.sorteado && a.vagas.length > 0);
    
    console.log('📋 Apartamentos sorteados encontrados:', sortedApartments.map(a => ({
      apt: a.id,
      vagas: a.vagas,
      tipo: getApartmentType(a.id)
    })));
    
    // Aplica cada sorteio novamente
    sortedApartments.forEach(apartment => {
      apartment.vagas.forEach(vagaId => {
        const spotIndex = newGarage.spots.findIndex(s => s.id === vagaId);
        if (spotIndex >= 0) {
          newGarage.spots[spotIndex].occupiedBy = apartment.id;
        }
      });
      
      const aptIndex = newApartments.findIndex(a => a.id === apartment.id);
      if (aptIndex >= 0) {
        newApartments[aptIndex] = { ...apartment };
      }
    });
    
    // Atualiza os estados
    setGarage(newGarage);
    setApartments(newApartments);
    
    console.log('✅ Estados revalidados e sincronizados');
  };

  /* Função para debug da vaga 22 */
  const debugVaga22 = () => {
    console.log('🔍 DEBUG - Investigando vaga 22...');
    
    // Encontrar a vaga 22 no estado
    const vaga22 = garage.spots.find(s => {
      const vagaNumber = positionToSequentialNumber(s.floor, s.side, s.pos);
      return vagaNumber === 22;
    });
    
    console.log('📍 Vaga 22 encontrada:', vaga22);
    
    // Encontrar qual apartamento deveria ter a vaga 22
    const apartamentoComVaga22 = apartments.find(a => 
      a.vagas.some(vagaId => {
        const [floor, sidePos] = vagaId.split('-');
        const side = sidePos.charAt(0);
        const pos = Number.parseInt(sidePos.slice(1));
        const vagaNumber = positionToSequentialNumber(floor, side, pos);
        return vagaNumber === 22;
      })
    );
    
    console.log('🏠 Apartamento que deveria ter vaga 22:', apartamentoComVaga22);
    
    // Verificar apartamento 502 especificamente
    const apt502 = apartments.find(a => a.id === 502);
    console.log('🏠 Apartamento 502:', apt502);
    
    // Verificar apartamento 302 especificamente  
    const apt302 = apartments.find(a => a.id === 302);
    console.log('🏠 Apartamento 302:', apt302);
  };
  const generatePrintList = () => {
    // Revalidação automática antes de gerar o PDF para garantir consistência
    console.log('🔄 Sincronizando estados antes da impressão...');
    
    const sortedApartments = apartments
      .filter(a => a.sorteado && a.vagas.length > 0)
      .sort((a, b) => a.id - b.id);

    // Validação automática: verificar consistência entre apartamentos e visualização
    let inconsistencyFound = false;
    for (const apartment of sortedApartments) {
      for (const vagaId of apartment.vagas) {
        const spot = garage.spots.find(s => s.id === vagaId);
        if (spot && spot.occupiedBy !== apartment.id) {
          console.warn(`⚠️ Inconsistência detectada: Vaga ${vagaId} no apartamento ${apartment.id} mas visualização mostra ${spot.occupiedBy}`);
          inconsistencyFound = true;
        }
      }
    }

    if (inconsistencyFound) {
      console.log('🔧 Corrigindo inconsistências automaticamente...');
      // Aplicar correção automática
      setGarage((prevGarage) => {
        const newGarage = { ...prevGarage };
        newGarage.spots = newGarage.spots.map(spot => {
          // Resetar ocupação
          const newSpot = { ...spot, occupiedBy: null };
          
          // Reaplicar baseado nos apartamentos sorteados
          const ownerApartment = sortedApartments.find(apt => 
            apt.vagas.includes(spot.id)
          );
          
          if (ownerApartment) {
            newSpot.occupiedBy = ownerApartment.id;
          }
          
          return newSpot;
        });
        return newGarage;
      });
      
      console.log('✅ Estados sincronizados automaticamente');
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let printContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Resultado do Sorteio de Garagens - Flor de Lis</title>
    <style>
        @page { margin: 2cm; }
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.4; 
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header .subtitle {
            font-size: 18px;
            margin: 10px 0;
            color: #666;
        }
        .date-info {
            font-size: 14px;
            color: #888;
        }
        .summary {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .summary h2 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .results-table th,
        .results-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .results-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .results-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .apartment-type {
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
        }
        .type-dupla { background: #fef3c7; color: #92400e; }
        .type-simples { background: #dbeafe; color: #1e40af; }
        .type-extendida { background: #f3e8ff; color: #6b21a8; }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RESULTADO DO SORTEIO DE GARAGENS</h1>
        <div class="subtitle">Edifício Flor de Lis</div>
        <div class="date-info">
            Sorteio realizado em: ${dateStr} às ${timeStr}
        </div>
    </div>

    <div class="summary">
        <h2>📊 Resumo do Sorteio</h2>
        <p><strong>Total de apartamentos sorteados:</strong> ${sortedApartments.length}</p>
        <p><strong>Total de vagas atribuídas:</strong> ${sortedApartments.reduce((sum, apt) => sum + apt.vagas.length, 0)}</p>
        <p><strong>Apartamentos duplos:</strong> ${sortedApartments.filter(a => getApartmentType(a.id) === 'dupla').length}</p>
        <p><strong>Apartamentos simples:</strong> ${sortedApartments.filter(a => getApartmentType(a.id) === 'simples').length}</p>
        <p><strong>Apartamentos extendidos:</strong> ${sortedApartments.filter(a => getApartmentType(a.id) === 'extendida').length}</p>
    </div>

    <table class="results-table">
        <thead>
            <tr>
                <th>Apartamento</th>
                <th>Tipo</th>
                <th>Vaga(s) Sorteada(s)</th>
                <th>Andar da Garagem</th>
            </tr>
        </thead>
        <tbody>`;

    sortedApartments.forEach(apartment => {
      const type = getApartmentType(apartment.id);
      const typeClass = `type-${type}`;
      
      // Converter IDs das vagas para números sequenciais
      const vagasSequenciais = apartment.vagas.map(vagaId => {
        // vagaId está no formato "G1-A1", "G2-C5", etc.
        const [floor, sidePos] = vagaId.split('-');
        const side = sidePos.charAt(0); // A, B, C, D, E, F
        const pos = parseInt(sidePos.slice(1)); // 1, 2, 3, etc.
        return positionToSequentialNumber(floor, side, pos);
      });
      
      const vagasStr = vagasSequenciais.join(', ');
      
      // Determinar andar da garagem baseado na primeira vaga
      let andarGaragem = '';
      if (vagasSequenciais.length > 0) {
        const primeiraVaga = vagasSequenciais[0];
        if (primeiraVaga <= 14) andarGaragem = 'G1';
        else if (primeiraVaga <= 28) andarGaragem = 'G2';
        else andarGaragem = 'G3';
      }

      printContent += `
            <tr>
                <td><strong>${apartment.id}</strong></td>
                <td><span class="apartment-type ${typeClass}">${type.toUpperCase()}</span></td>
                <td>${vagasStr}</td>
                <td>${andarGaragem}</td>
            </tr>`;
    });

    printContent += `
        </tbody>
    </table>

    <div class="footer">
        <p>Sistema de Sorteio de Garagens - Flor de Lis</p>
        <p>Documento gerado automaticamente em ${dateStr} às ${timeStr}</p>
    </div>
</body>
</html>`;

    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar carregamento e abrir diálogo de impressão
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  /* Handlers */
  // Função para determinar o tipo do apartamento
  const getApartmentType = (apartmentId) => {
    return getExclusiveApartmentType(apartmentId);
  };

  // Função para obter a cor do badge baseado no tipo
  const getBadgeStyle = (type) => {
    const styles = {
      simples: { background: "#dbeafe", color: "#1e40af" },
      dupla: { background: "#fef3c7", color: "#92400e" },
      extendida: { background: "#f3e8ff", color: "#6b21a8" }
    };
    return styles[type] || styles.simples;
  };

  const toggleSpotBlock = (spotId) => {
    setGarage((prev) => ({
      ...prev,
      spots: prev.spots.map((s) =>
        s.id === spotId ? { ...s, blocked: !s.blocked } : s
      ),
    }));
    // Reset preprocessamento ao alterar bloqueios
    setDoubleReservations(null);
    setPreprocessed(false);
  };

  const onSeed = (v) => {
    setSeed(v);
    resetRng(v);
  };

  const pending = apartments.filter((a) => a.ativo && !a.sorteado).length;

  /* ===== Helpers de UI ===== */
  // IMPORTANTE: não mostramos mais o estado de reservado visualmente.
  const spotBgColor = (spot) => {
    if (spot.blocked) return COLORS.blocked;
    if (spot.occupiedBy) return COLORS.selected;
    
    // Verificar se é uma vaga extendida
    const vagaNumber = positionToSequentialNumber(spot.floor, spot.side, spot.pos);
    if (isVagaExtendida(vagaNumber)) return COLORS.extended;
    
    return COLORS.free; // sempre verde se livre (mesmo que pertencente a um par reservado)
  };
  const spotTextColor = (spot) => {
    const bg = spotBgColor(spot);
    if (bg === COLORS.free || bg === COLORS.extended) return "#0b1220"; // texto escuro para fundos claros
    return "#ffffff"; // texto branco para fundos escuros
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f14", color: "#eaeef2" }}>
      <style>{`
        /* FULL-WIDTH + RESET */
        :root, html, body, #root { width:100%; height:100%; }
        body { margin:0; background:#0b0f14; }

        /* ====== Densidade (padrão: compacta) ====== */
        :root{
          --apt-col-min: 150px;
          --apt-card-pad: 8px;
          --apt-title: 13px;
          --apt-badge: 10px;
          --left-col-min: 440px;
          --left-col-max: 580px;
          --gap: 12px;
        }
        .compact {
          --apt-col-min: 130px;
          --apt-card-pad: 6px;
          --apt-title: 12px;
          --apt-badge: 9.5px;
          --left-col-min: 500px;
          --left-col-max: 640px;
          --gap: 10px;
        }

        .wrap {
          width: min(1800px, 100vw - 48px);
          margin: 0 auto;
          padding: 24px;
          box-sizing: border-box;
        }
        .twoCols {
          display: grid;
          grid-template-columns: minmax(var(--left-col-min), var(--left-col-max)) 1fr;
          gap: 24px;
          align-items: start;
        }
        .leftSticky {
  position: sticky;
  top: 16px;
  align-self: start;
  max-height: calc(100vh - 32px);
  overflow-y: auto;       /* ✅ só rolagem vertical */
  overflow-x: hidden;     /* ✅ impede scroll lateral */
}


        @media (max-width: 1200px) {
          .twoCols { grid-template-columns: 1fr; }
          .leftSticky { position:static; max-height:none; }
        }
      `}</style>

      <div className={`wrap ${compact ? "compact" : ""}`}>
        {/* Validação da Configuração */}
        {configLoaded && !configValidation.isValid && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: "#b91c1c"
          }}>
            <strong>⚠️ Problemas na configuração:</strong>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {configValidation.errors.map((error, idx) => (
                <li key={`error-${idx}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Status do carregamento da configuração */}
        <div style={{
          background: configLoaded ? "#f0fdf4" : "#fef3c7",
          border: `1px solid ${configLoaded ? "#bbf7d0" : "#fcd34d"}`,
          borderRadius: 8,
          padding: 8,
          marginBottom: 16,
          fontSize: 14,
          color: configLoaded ? "#15803d" : "#92400e"
        }}>
          {configLoaded ? "✅ Configuração carregada" : "🔄 Carregando configuração..."}
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
          Sorteio de Garagens — Flor de Lis
        </h1>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            type="number"
            value={seed}
            onChange={(e) => onSeed(e.target.value)}
            style={{
              padding: "6px 8px",
              border: "1px solid #334155",
              borderRadius: 6,
              background: "#0b0f14",
              color: "#eaeef2",
            }}
            hidden
          />
          <button
            onClick={drawOne}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#4f46e5",
              color: "#fff",
              border: 0,
            }}
          >
            Sortear ({pending})
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#1f2937",
              color: "#fff",
              border: 0,
            }}
          >
            Limpar
          </button>

          <button
            onClick={generatePrintList}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#059669",
              color: "#fff",
              border: 0,
            }}
          >
            📄 Imprimir Lista
          </button>

          <button
            onClick={() => setCompact((c) => !c)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#0f172a",
              color: "#eaeef2",
              border: "1px solid #1e293b",
              marginLeft: "auto",
            }}
          >
            Densidade: {compact ? "Compacta" : "Conforto"}
          </button>
        </div>

        <div className="twoCols">
          {/* ESQUERDA: Apartamentos (sticky) */}
          <aside className="leftSticky">
            <div
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 16,
                padding: 16,
              }}
            >
              {lastDraw && (
                <div
                  style={{
                    background: "#1e3a8a",
                    borderRadius: 12,
                    padding: "20px 16px",
                    marginBottom: 16,
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    Último sorteado: Apto {lastDraw.aptId}
                  </div>
                  <div style={{ fontSize: 20, marginTop: 6 }}>
                    Garagem: {lastDraw.vagas.map(vagaIdToSequentialNumber).join(", ")}
                  </div>
                </div>
              )}

              <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Apartamentos</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(var(--apt-col-min), 1fr))",
                  gap: "var(--gap)",
                }}
              >
                {apartments.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      border: a.ativo ? "1px solid #1e293b" : "1px solid #7f1d1d",
                      borderRadius: 12,
                      padding: "var(--apt-card-pad)",
                      background: a.ativo ? "#0b1220" : "#2a0b0b",
                      display: "flex",
                      flexDirection: "column",
                      gap: "calc(var(--gap) - 4px)",
                    }}
                    title={a.ativo ? "" : "Não participa do sorteio"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "ui-monospace, Menlo, Monaco",
                          fontSize: "var(--apt-title)",
                        }}
                      >
                        #{a.id}
                      </span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {(() => {
                          const type = getApartmentType(a.id);
                          const style = getBadgeStyle(type);
                          const labels = {
                            simples: 'Simples',
                            dupla: 'Dupla',
                            extendida: 'Extendida'
                          };
                          return (
                            <span
                              style={{
                                fontSize: 12,
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontWeight: 500,
                                ...style
                              }}
                            >
                              {labels[type]}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "calc(var(--gap) - 4px)", flexWrap: "wrap" }}>
                      {!a.ativo && (
                        <span
                          style={{
                            fontSize: "var(--apt-badge)",
                            padding: "1px 6px",
                            borderRadius: 999,
                            background: "#fecaca",
                            color: "#7f1d1d",
                          }}
                        >
                          Inativo
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "var(--apt-badge)",
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: a.dupla ? "#fef3c7" : "#d1fae5",
                          color: a.dupla ? "#92400e" : "#065f46",
                          opacity: a.ativo ? 1 : 0.7,
                        }}
                      >
                        {a.dupla ? "Dupla" : "Simples"}
                      </span>
                      {a.sorteado && (
                        <span
                          style={{
                            fontSize: "var(--apt-badge)",
                            padding: "1px 6px",
                            borderRadius: 999,
                            background: "#e0e7ff",
                            color: "#3730a3",
                          }}
                        >
                          Sorteado
                        </span>
                      )}
                      {a.vagas.length > 0 && (
                        <span style={{ fontSize: "var(--apt-badge)", color: "#94a3b8" }}>
                          {a.vagas.map(vagaIdToSequentialNumber).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* DIREITA: Garagens */}
          <main>
            <div style={{ display: "grid", gap: 16 }}>
              {FLOORS.map((floor) => (
                <section
                  key={floor}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <h2 style={{ fontWeight: 700, marginBottom: 12 }}>{floor}</h2>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(14, 1fr)",
                      gap: 8,
                      maxWidth: "100%"
                    }}
                  >
                    {SIDES_BY_FLOOR[floor].flatMap((side) =>
                      POSITIONS.map((pos) => {
                        const spot = garage.spots.find(
                          (s) => s.floor === floor && s.side === side && s.pos === pos
                        );
                        const bg = spotBgColor(spot);
                        const color = spotTextColor(spot);
                        const vagaNumber = positionToSequentialNumber(floor, side, pos);
                        return (
                          <div
                            key={spot.id}
                            title={`Vaga ${vagaNumber}${spot.occupiedBy ? ` - Apartamento ${spot.occupiedBy}` : ''}`}
                            style={{
                              height: 56,
                              width: 56,
                              borderRadius: 10,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #0b1220",
                              background: bg,
                              color,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: "bold"
                            }}
                            onClick={() => toggleSpotBlock(spot.id)}
                          >
                            <span>{vagaNumber}</span>
                            {spot.occupiedBy && (
                              <span style={{ fontSize: 10 }}>apt {spot.occupiedBy}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
