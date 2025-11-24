import React, { useRef, useState, useEffect } from "react";
import {
  apartamentoTemDireitoDupla,
  positionToSequentialNumber,
  getExclusiveApartmentType,
  validateConfigExclusivity,
  loadConfigFromFile,
  isVagaEstendida,
  getVagasProibidasDuplo, // 🎯 NOVO
  sorteioConfig
} from "./config/sorteioConfig.js";

// Importar o novo sistema SOLID
import { LotterySystemFactory } from "./core/index.js";
import { Apartment } from "./core/models/Apartment.js";
import { Garage } from "./core/models/Garage.js";
import { Spot } from "./core/models/Spot.js";

/* ===== Aleatoriedade ===== */
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
  // Como agora os IDs já são numéricos, apenas retorna o próprio ID
  return typeof vagaId === 'number' ? vagaId : parseInt(vagaId);
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
  extended: "#f97316",  // laranja (vaga estendida)
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

        // Calcular IDs numéricos das vagas do par
        const aId = positionToSequentialNumber(floor, side, p1);
        const bId = positionToSequentialNumber(floor, side, p2);

        pairs[parId] = {
          id: parId,
          floor,
          side,
          aPos: p1,
          bPos: p2,
          aId,
          bId,
          reservedFor: null,
        };
      }
      for (const pos of POSITIONS) {
        const naturalPair = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
        const [p1, p2] = naturalPair || [pos, pos]; // fallback para posições sem par

        // Usar ID numérico sequencial para a vaga
        const vagaId = positionToSequentialNumber(floor, side, pos);

        spots.push({
          id: vagaId,
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

      // ✅ VERIFICAR SE É APARTAMENTO ESTENDIDO
      const isExtendido = sorteioConfig.apartamentosVagasEstendidas.includes(num);

      list.push({
        id: num,
        dupla: temDireitoDupla,
        estendido: isExtendido, // ✅ Adicionar propriedade estendido
        sorteado: false,
        vagas: [],
        ativo: true
      });
    }
  }
  return list;
}

/* ===== Funções de conversão para o sistema SOLID ===== */
function convertToSolidGarage(uiGarage) {
  // Converter formato UI para formato SOLID usando a classe Garage
  if (uiGarage.spots && uiGarage.pairs) {
    // Converter spots para instâncias de Spot
    const solidSpots = uiGarage.spots.map(spot => {
      const solidSpot = new Spot(
        spot.id,
        spot.floor,
        spot.side,
        spot.pos,
        'VAGA' // type fixo como VAGA
      );

      // Configurar propriedades adicionais
      solidSpot.blocked = spot.blocked || false;
      solidSpot.occupiedBy = spot.occupiedBy || null;
      solidSpot.parId = spot.parId || null;

      return solidSpot;
    });

    // Criar instância de Garage
    return new Garage(solidSpots, uiGarage.pairs);
  }

  // Fallback para formato de matriz (caso ainda seja usado em algum lugar)
  const spots = [];
  const pairs = {};

  if (Array.isArray(uiGarage)) {
    uiGarage.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.type === 'VAGA') {
          spots.push(new Spot(
            cell.id,
            cell.floor,
            cell.side,
            cell.pos,
            cell.blocked || false,
            cell.occupiedBy || null,
            cell.parId || null
          ));
        }
      });
    });
  }

  // Adicionar pares se existirem
  if (uiGarage.pairs) {
    Object.assign(pairs, uiGarage.pairs);
  }

  return new Garage(spots, pairs);
}

function convertFromSolidGarage(solidGarage) {
  // Converter formato SOLID de volta para formato UI
  return {
    spots: solidGarage.spots.map(spot => ({
      id: spot.id,
      floor: spot.floor,
      side: spot.side,
      pos: spot.pos,
      blocked: spot.blocked || false,
      occupiedBy: spot.occupiedBy || null,
      parId: spot.parId || null
    })),
    pairs: { ...solidGarage.pairs }
  };
}

/* ===== Componente Principal ===== */
export default function GarageLotteryApp() {
  /* Estado */
  const [seed, setSeed] = useState(12345);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [compact, setCompact] = useState(true); // densidade de layout
  const [garage, setGarage] = useState(buildInitialGarage());
  const [apartments, setApartments] = useState([]);  // Inicia vazio, será preenchido após carregar config
  const [lastDraw, setLastDraw] = useState(null); // { aptId, vagas }
  const [isProcessing, setIsProcessing] = useState(false);
  const [doublePairReservations, setDoublePairReservations] = useState({}); // Pré-reservas para apartamentos duplos

  // Novo sistema SOLID de sorteio
  const lotterySystem = useRef(null);

  /* Inicializar sistema SOLID */
  useEffect(() => {
    if (configLoaded) {
      lotterySystem.current = LotterySystemFactory.createSystem({
        seed: seed,
        isExtendedSpotFn: isVagaEstendida,
        isExtendedApartmentFn: (apartmentId) => sorteioConfig.apartamentosVagasEstendidas.includes(apartmentId)
      });
    }
  }, [configLoaded, seed]);

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

  /* Nova funcionalidade de sorteio usando arquitetura SOLID */
  const drawOne = async () => {
    if (isProcessing || !lotterySystem.current) return;

    setIsProcessing(true);

    try {
      // PRIMEIRO: Sincronizar estado da garagem com os apartamentos sorteados
      setGarage(prevGarage => {
        const syncedSpots = prevGarage.spots.map(spot => {
          // Verificar se algum apartamento tem essa vaga
          const apartmentWithSpot = apartments.find(apt =>
            apt.sorteado && apt.vagas && apt.vagas.includes(spot.id)
          );

          return {
            ...spot,
            occupiedBy: apartmentWithSpot ? apartmentWithSpot.id : null
          };
        });

        return {
          ...prevGarage,
          spots: syncedSpots
        };
      });

      // Aguardar que o estado seja atualizado
      await new Promise(resolve => setTimeout(resolve, 50));

      // Converter dados para formato SOLID
      const solidApartments = apartments.map(apt => Apartment.fromJSON({
        id: apt.id,
        apartmentNumber: apt.id.toString(),
        ativo: apt.ativo,
        dupla: apt.dupla,
        estendido: apt.estendido, // ✅ Incluir propriedade estendido
        sorteado: apt.sorteado,
        vagas: apt.vagas || []
      }));

      const solidGarage = convertToSolidGarage(garage);

      // Restaurar pré-reservas existentes
      solidGarage.doublePairReservations = { ...doublePairReservations };

      // Debug: verificar estado atual da garagem
      const occupiedSpots = solidGarage.spots.filter(s => s.occupiedBy);
      console.log(`🔍 Debug: ${occupiedSpots.length} vagas já ocupadas antes do sorteio`);

      // ========== PRÉ-RESERVA PARA APARTAMENTOS DUPLOS ==========
      // Verificar se ainda existem apartamentos duplos não sorteados
      const undrawnDoubleApartments = solidApartments.filter(apt =>
        apt.dupla && apt.isAvailableForDraw()
      );

      // Se há apartamentos duplos não sorteados e não há pré-reservas ativas, fazer pré-reserva
      const hasActiveReservations = Object.keys(solidGarage.doublePairReservations).length > 0;

      if (undrawnDoubleApartments.length > 0 && !hasActiveReservations) {
        console.log(`📋 Pré-reservando vagas para ${undrawnDoubleApartments.length} apartamentos duplos restantes`);

        // 🎯 NOVO: Obter vagas proibidas para duplos
        const vagasProibidasDuplo = getVagasProibidasDuplo();
        const preReserveSuccess = solidGarage.preReserveDoublePairs(undrawnDoubleApartments.length, vagasProibidasDuplo);

        if (!preReserveSuccess) {
          setError(`Não há pares suficientes para ${undrawnDoubleApartments.length} apartamentos duplos restantes`);
          setIsProcessing(false);
          return;
        }
        // Persistir pré-reservas no estado do React
        setDoublePairReservations({ ...solidGarage.doublePairReservations });
      }

      // Executar sorteio usando o novo sistema SOLID
      const result = lotterySystem.current.orchestrator.executeSorting(solidApartments, solidGarage);

      if (result.success) {
        // 🎉 Verificar se todos os apartamentos foram sorteados
        if (result.allApartmentsSorted) {
          console.log('🎉 Sorteio foi finalizado com sucesso.');
          console.log('✅ Todos os apartamentos foram sorteados');
          alert('🎉 Sorteio foi finalizado com sucesso! Todos os apartamentos foram sorteados.');
          return; // Sair da função pois não há mais nada para fazer
        }

        // Converter resultado de volta para formato da UI
        const spotIds = result.spotData.type === 'double'
          ? [result.spotData.pair.aId, result.spotData.pair.bId]
          : [result.spotData.spot.id];

        // Atualizar pré-reservas (podem ter sido modificadas durante o sorteio)
        setDoublePairReservations({ ...result.assignmentResult.garage.doublePairReservations });

        // Atualizar estado da garagem
        setGarage(convertFromSolidGarage(result.assignmentResult.garage));

        // Atualizar apartamento como sorteado
        setApartments(prev =>
          prev.map(apt =>
            apt.id === result.apartment.id
              ? {
                ...apt,
                sorteado: true,
                vagas: spotIds
              }
              : apt
          )
        );

        // Atualizar último sorteio
        setLastDraw({
          aptId: result.apartment.id,
          vagas: spotIds
        });

        console.log(`✅ Sorteio concluído: Apartamento ${result.apartment.id} → Vagas ${spotIds.join(', ')}`);
        console.log(`✅ Sorteio concluído: Apartamento ${result.apartment.id} → Vagas ${spotIds.join(', ')}`);
      } else {
        // 🎉 Verificar se todos os apartamentos foram sorteados
        if (result.allApartmentsSorted) {
          console.log('🎉 Sorteio foi finalizado com sucesso.');
          console.log('✅ Todos os apartamentos foram sorteados');
          alert('🎉 Sorteio foi finalizado com sucesso! Todos os apartamentos foram sorteados.');

          // 🖨️ Automaticamente abrir a página de impressão para preservar o resultado
          console.log('🖨️ Abrindo página de impressão automaticamente...');
          setTimeout(() => {
            generatePrintList();
          }, 500); // Pequeno delay para garantir que o alert seja fechado primeiro

        } else {
          console.log(`❌ Falha no sorteio: ${result.message}`);
          alert(`Falha no sorteio: ${result.message}`);
        }
      }

    } catch (error) {
      console.error('❌ Erro no sorteio:', error);
      alert(`Erro no sorteio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /* Reset */
  const clearAll = () => {
    // 🛡️ Verificar se todos os apartamentos foram sorteados antes de limpar
    const apartmentosDisponiveis = apartments.filter(apt => !apt.sorteado);
    const todosApartamentosSorteados = apartmentosDisponiveis.length === 0 && apartments.length > 0;

    if (todosApartamentosSorteados) {
      const confirmacao = window.confirm(
        '⚠️ ATENÇÃO: O sorteio foi FINALIZADO com todos os apartamentos sorteados!\n\n' +
        'Você tem certeza que deseja LIMPAR TUDO e perder o resultado do sorteio?\n\n' +
        '💡 Recomendamos que você imprima a lista primeiro.\n\n' +
        'Deseja continuar mesmo assim?'
      );

      if (!confirmacao) {
        console.log('🛡️ Limpeza cancelada pelo usuário - sorteio preservado');
        return; // Não limpa se o usuário cancelar
      }
    }

    setGarage(buildInitialGarage());
    setApartments(buildInitialApartments());
    setLastDraw(null);
    setDoublePairReservations({}); // Limpar pré-reservas
    // Recriar o sistema SOLID com nova seed
    if (lotterySystem.current) {
      lotterySystem.current = LotterySystemFactory.createSystem({
        seed: seed,
        isExtendedSpotFn: isVagaEstendida,
        isExtendedApartmentFn: (apartmentId) => sorteioConfig.apartamentosVagasEstendidas.includes(apartmentId)
      });
    }
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
        .type-estendida { background: #f3e8ff; color: #6b21a8; }
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
        <p><strong>Apartamentos estendidos:</strong> ${sortedApartments.filter(a => getApartmentType(a.id) === 'estendida').length}</p>
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

      // As vagas já são números sequenciais, apenas converter para array de números
      const vagasSequenciais = apartment.vagas.map(vagaId =>
        typeof vagaId === 'number' ? vagaId : parseInt(vagaId)
      );

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
      estendida: { background: "#f3e8ff", color: "#6b21a8" }
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
    // Recriar o sistema SOLID ao alterar bloqueios
    if (lotterySystem.current) {
      lotterySystem.current = LotterySystemFactory.createSystem({
        seed: seed,
        isExtendedSpotFn: isVagaEstendida,
        isExtendedApartmentFn: (apartmentId) => sorteioConfig.apartamentosVagasEstendidas.includes(apartmentId)
      });
    }
  };

  const onSeed = (v) => {
    setSeed(v);
  };

  const pending = apartments.filter((a) => a.ativo && !a.sorteado).length;

  /* ===== Helpers de UI ===== */
  // IMPORTANTE: não mostramos mais o estado de reservado visualmente.
  const spotBgColor = (spot) => {
    if (spot.blocked) return COLORS.blocked;
    if (spot.occupiedBy) return COLORS.selected;

    // Verificar se é uma vaga com localização física diferente (sempre laranja)
    const vagaNumber = positionToSequentialNumber(spot.floor, spot.side, spot.pos);
    if ([7, 8, 21, 22, 35, 36].includes(vagaNumber)) return COLORS.extended;

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
                            estendida: 'Estendida'
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
                        const vagaNumber = positionToSequentialNumber(floor, side, pos);
                        const spot = garage.spots.find(
                          (s) => s.id === vagaNumber
                        );
                        const bg = spotBgColor(spot);
                        const color = spotTextColor(spot);
                        return (
                          <div
                            key={vagaNumber}
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
                            onClick={() => toggleSpotBlock(vagaNumber)}
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
