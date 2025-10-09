import React, { useMemo, useRef, useState } from "react";

// =============================
// Utilidades
// =============================
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

// =============================
// Modelo de dados
// =============================
const FLOORS = ["G1", "G2", "G3"];
const SIDES = ["A", "B"];
const POSITIONS = [1, 2, 3, 4, 5, 6];
const NATURAL_PAIRS = [
  [1, 2],
  [3, 4],
  [5, 6],
];

function buildInitialGarage() {
  const spots = []; // {id, floor, side, pos, parId, blocked, occupiedBy}
  const pairs = {}; // parId -> {id, floor, side, aId, bId, reservedFor: aptId|null}

  for (const floor of FLOORS) {
    for (const side of SIDES) {
      // criar pares naturais primeiro
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
      // criar vagas
      for (const pos of POSITIONS) {
        const pair = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
        const parId = `${floor}-${side}-${pair[0]}-${pair[1]}`;
        spots.push({
          id: `${floor}-${side}${pos}`,
          floor,
          side,
          pos,
          parId,
          blocked: false,
          occupiedBy: null, // aptId
        });
      }
    }
  }
  return { spots, pairs };
}

// =============================
// App principal
// =============================
export default function GarageLotteryApp() {
  // Estado base
  const [seed, setSeed] = useState(12345);
  const randRef = useRef(mulberry32(12345));

  const [flags, setFlags] = useState({
    balancearDistribuicao: true,
    protegerTodosOsParesAteAtenderDuplas: false,
    permitirVagaSimplesEmParNaoReservado: true,
    logConsoleDetalhado: true,
  });

  const [garage, setGarage] = useState(buildInitialGarage());
  const [apartments, setApartments] = useState(() => {
    // Exemplo inicial — edite livremente depois
    // id pode ser algo como "101", "102" etc.
    const list = [];
    for (let i = 101; i <= 112; i++) list.push({ id: String(i), dupla: false, sorteado: false, vagas: [] });
    for (let i = 201; i <= 212; i++) list.push({ id: String(i), dupla: false, sorteado: false, vagas: [] });
    for (let i = 301; i <= 312; i++) list.push({ id: String(i), dupla: false, sorteado: false, vagas: [] });
    // marcar alguns como duplos só para demonstração
    ["103", "205", "209", "311"].forEach((id) => {
      const apt = list.find((a) => a.id === id);
      if (apt) apt.dupla = true;
    });
    return list;
  });

  // Reservas pré-processadas: aptId -> parId
  const [doubleReservations, setDoubleReservations] = useState(null);
  const [preprocessed, setPreprocessed] = useState(false);

  // Contadores por (floor, side)
  const counts = useMemo(() => {
    const m = new Map();
    for (const f of FLOORS) for (const s of SIDES) m.set(`${f}-${s}`, 0);
    for (const sp of garage.spots) {
      if (sp.occupiedBy) m.set(`${sp.floor}-${sp.side}`, m.get(`${sp.floor}-${sp.side}`) + 1);
    }
    return m;
  }, [garage]);

  // =============================
  // Helpers
  // =============================
  const log = (...args) => {
    if (flags.logConsoleDetalhado) console.log("[Sorteio]", ...args);
  };

  const resetRng = (newSeed) => {
    randRef.current = mulberry32(Number(newSeed) || 0);
  };

  const pickRandom = (arr) => {
    if (!arr.length) return null;
    const idx = Math.floor(randRef.current() * arr.length);
    return arr[idx];
  };

  const getFreePairs = (state) => {
    const { spots, pairs } = state;
    const freePairs = [];
    for (const parId in pairs) {
      const par = pairs[parId];
      const aFree = !spots.find((s) => s.id === par.aId).occupiedBy;
      const bFree = !spots.find((s) => s.id === par.bId).occupiedBy;
      const aBlocked = spots.find((s) => s.id === par.aId).blocked;
      const bBlocked = spots.find((s) => s.id === par.bId).blocked;
      if (aFree && bFree && !aBlocked && !bBlocked) {
        freePairs.push(par);
      }
    }
    return freePairs;
  };

  const countByRegion = (state) => {
    const map = new Map();
    for (const f of FLOORS) for (const s of SIDES) map.set(`${f}-${s}`, 0);
    for (const sp of state.spots) if (sp.occupiedBy) map.set(`${sp.floor}-${sp.side}`, map.get(`${sp.floor}-${sp.side}`) + 1);
    return map;
  };

  const chooseBalancedPair = (pairsList, state) => {
    if (!flags.balancearDistribuicao || pairsList.length <= 1) return pickRandom(pairsList);
    const regionCounts = countByRegion(state);
    // escolher as regiões menos carregadas
    let min = Infinity;
    for (const par of pairsList) {
      const c = regionCounts.get(`${par.floor}-${par.side}`) || 0;
      if (c < min) min = c;
    }
    const candidates = pairsList.filter((par) => (regionCounts.get(`${par.floor}-${par.side}`) || 0) === min);
    return pickRandom(candidates);
  };

  const chooseBalancedSpot = (spotsList, state) => {
    if (!flags.balancearDistribuicao || spotsList.length <= 1) return pickRandom(spotsList);
    const regionCounts = countByRegion(state);
    let min = Infinity;
    for (const sp of spotsList) {
      const c = regionCounts.get(`${sp.floor}-${sp.side}`) || 0;
      if (c < min) min = c;
    }
    const candidates = spotsList.filter((sp) => (regionCounts.get(`${sp.floor}-${sp.side}`) || 0) === min);
    return pickRandom(candidates);
  };

  // =============================
  // Pré-processamento de duplas (oculto)
  // =============================
  const runPreprocessIfNeeded = () => {
    if (preprocessed && doubleReservations) return; // já feito

    const state = structuredClone({ spots: garage.spots, pairs: garage.pairs });

    const duplos = apartments.filter((a) => a.dupla).map((a) => a.id);
    const freePairs = getFreePairs(state);

    if (duplos.length > freePairs.length) {
      alert(`Não há pares suficientes para as duplas: duplas=${duplos.length}, pares livres=${freePairs.length}`);
      return;
    }

    // aleatorizar ordem dos duplos pela seed
    const duplosOrder = seededShuffle(duplos, randRef.current);

    const reservations = {}; // aptId -> parId

    log("Pré-processo: ordem de duplos:", duplosOrder);

    for (const aptId of duplosOrder) {
      const free = getFreePairs(state);
      if (!free.length) {
        alert("Falha ao reservar pares: esgotou antes de atender todas as duplas.");
        return;
      }
      const chosen = chooseBalancedPair(free, state);
      reservations[aptId] = chosen.id;

      // marcar como ocupado no estado temporário para seguir balanceando
      const a = state.spots.find((s) => s.id === chosen.aId);
      const b = state.spots.find((s) => s.id === chosen.bId);
      a.occupiedBy = `RESERVA-${aptId}`;
      b.occupiedBy = `RESERVA-${aptId}`;

      log("Reservado par", chosen.id, "para apto", aptId);
    }

    // restaurar spots (remover marcas RESERVA visualmente; reservas ficam só no mapa)
    const restored = state.spots.map((s) => ({ ...s, occupiedBy: null }));

    // atualizar apenas o mapa de pares com reservedFor
    const newPairs = { ...garage.pairs };
    for (const aptId in reservations) {
      const parId = reservations[aptId];
      newPairs[parId] = { ...newPairs[parId], reservedFor: aptId };
    }

    setGarage((prev) => ({ spots: restored, pairs: newPairs }));
    setDoubleReservations(reservations);
    setPreprocessed(true);
    log("Pré-processo concluído.");
  };

  // =============================
  // Alocação por clique (visual): apto -> vaga(s)
  // =============================
  const drawOne = () => {
    // garante pré-processo
    runPreprocessIfNeeded();

    // pendentes
    const pendentes = apartments.filter((a) => !a.sorteado);
    if (!pendentes.length) {
      alert("Todos os apartamentos já foram sorteados.");
      return;
    }

    // sorteia apto visivelmente
    const apt = pickRandom(pendentes);
    log("Apto sorteado:", apt.id, apt.dupla ? "(dupla)" : "(simples)");

    if (apt.dupla) {
      // usar reserva
      const parId = doubleReservations?.[apt.id];
      let chosenPair = parId ? garage.pairs[parId] : null;

      // fallback se reserva estava indisponível por algum motivo
      if (!chosenPair) {
        log("Reserva ausente/indisponível; recalculando par elegível...");
        const free = getFreePairs(garage);
        if (!free.length) {
          alert(`Sem par livre para o apto duplo ${apt.id}.`);
          return;
        }
        chosenPair = chooseBalancedPair(free, garage);
      }

      // ocupar vagas do par
      setGarage((prev) => {
        const spots = prev.spots.map((s) => {
          if (s.id === chosenPair.aId || s.id === chosenPair.bId) {
            return { ...s, occupiedBy: apt.id };
          }
          return s;
        });
        const pairs = { ...prev.pairs };
        // limpeza da marca de reserva desse apto
        if (pairs[chosenPair.id]?.reservedFor === apt.id) {
          pairs[chosenPair.id] = { ...pairs[chosenPair.id], reservedFor: null };
        }
        return { spots, pairs };
      });

      setApartments((prev) => prev.map((a) => (a.id === apt.id ? { ...a, sorteado: true, vagas: [chosenPair.aId, chosenPair.bId] } : a)));
      log("Dupla alocada para apto", apt.id, "->", chosenPair.id);
    } else {
      // apto simples: selecionar vaga elegível
      const freeSpots = garage.spots.filter((s) => !s.blocked && !s.occupiedBy);

      let candidates = [...freeSpots];

      // proteger reservas de duplas
      if (doubleReservations) {
        const reservedParIds = new Set(Object.values(doubleReservations));
        const reservedSpotIds = new Set();
        for (const parId of reservedParIds) {
          const p = garage.pairs[parId];
          if (p?.reservedFor) {
            reservedSpotIds.add(p.aId);
            reservedSpotIds.add(p.bId);
          }
        }
        candidates = candidates.filter((s) => !reservedSpotIds.has(s.id));
      }

      // política opcional: proteger TODOS os pares enquanto houver duplas pendentes
      const duplasPendentes = apartments.some((a) => a.dupla && !a.sorteado);
      if (flags.protegerTodosOsParesAteAtenderDuplas && duplasPendentes) {
        // não deixar escolher uma vaga que quebraria um par ainda livre
        const freePairsNow = getFreePairs(garage);
        const pairSpotIds = new Set();
        for (const p of freePairsNow) {
          pairSpotIds.add(p.aId);
          pairSpotIds.add(p.bId);
        }
        candidates = candidates.filter((s) => !pairSpotIds.has(s.id));
      }

      if (!candidates.length) {
        alert(`Sem vagas elegíveis para o apto simples ${apt.id}.`);
        return;
      }

      const chosenSpot = chooseBalancedSpot(candidates, garage);

      setGarage((prev) => ({
        ...prev,
        spots: prev.spots.map((s) => (s.id === chosenSpot.id ? { ...s, occupiedBy: apt.id } : s)),
      }));
      setApartments((prev) => prev.map((a) => (a.id === apt.id ? { ...a, sorteado: true, vagas: [chosenSpot.id] } : a)));
      log("Simples alocada para apto", apt.id, "->", chosenSpot.id);
    }
  };

  // =============================
  // Limpar (reset total)
  // =============================
  const clearAll = () => {
    setGarage(buildInitialGarage());
    setDoubleReservations(null);
    setPreprocessed(false);
    setApartments((prev) => prev.map((a) => ({ ...a, sorteado: false, vagas: [] })));
    log("Reset realizado.");
  };

  // =============================
  // UI helpers
  // =============================
  const toggleBlockSpot = (spotId) => {
    setGarage((prev) => ({
      ...prev,
      spots: prev.spots.map((s) => (s.id === spotId ? { ...s, blocked: !s.blocked } : s)),
    }));
  };

  const handleToggleDupla = (aptId) => {
    setApartments((prev) => prev.map((a) => (a.id === aptId ? { ...a, dupla: !a.dupla } : a)));
    // alteração de duplas invalida reservas anteriores
    setDoubleReservations(null);
    setPreprocessed(false);
  };

  const handleSeedChange = (v) => {
    setSeed(v);
    resetRng(v);
  };

  const pendingCount = apartments.filter((a) => !a.sorteado).length;

  // =============================
  // Render
  // =============================
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sorteio de Garagens — Edifício Flor de Lis</h1>
            <p className="text-sm text-slate-600">Apto → Vaga(s) • Pré-processo oculto para duplas • Balanceamento entre G1/G2/G3 e A/B</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm">Seed</label>
              <input
                type="number"
                className="px-2 py-1 border rounded w-28"
                value={seed}
                onChange={(e) => handleSeedChange(e.target.value)}
              />
            </div>
            <button onClick={drawOne} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 shadow">
              Sortear ({pendingCount} pendente{pendingCount !== 1 ? "s" : ""})
            </button>
            <button onClick={clearAll} className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300">
              Limpar
            </button>
          </div>
        </header>

        {/* Configurações */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-2xl shadow space-y-3">
            <h2 className="font-semibold">Configurações</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={flags.balancearDistribuicao}
                onChange={(e) => setFlags({ ...flags, balancearDistribuicao: e.target.checked })}
              />
              <span>Balancear distribuição (G1/G2/G3 e A/B)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={flags.protegerTodosOsParesAteAtenderDuplas}
                onChange={(e) => setFlags({ ...flags, protegerTodosOsParesAteAtenderDuplas: e.target.checked })}
              />
              <span>Proteger todos os pares enquanto houver duplas pendentes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={flags.permitirVagaSimplesEmParNaoReservado}
                onChange={(e) => setFlags({ ...flags, permitirVagaSimplesEmParNaoReservado: e.target.checked })}
                disabled={flags.protegerTodosOsParesAteAtenderDuplas}
              />
              <span>Permitir simples em par não reservado</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={flags.logConsoleDetalhado}
                onChange={(e) => setFlags({ ...flags, logConsoleDetalhado: e.target.checked })}
              />
              <span>Log detalhado no console</span>
            </label>
            <p className="text-xs text-slate-500">Alterar duplas, bloqueios ou flags reinicia o pré-processo.</p>
          </div>

          {/* Apartamentos */}
          <div className="p-4 bg-white rounded-2xl shadow">
            <h2 className="font-semibold mb-2">Apartamentos</h2>
            <div className="max-h-80 overflow-auto divide-y">
              {apartments.map((a) => (
                <div key={a.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono">#{a.id}</span>
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded " +
                        (a.dupla ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")
                      }
                    >
                      {a.dupla ? "Dupla" : "Simples"}
                    </span>
                    {a.sorteado && (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Sorteado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {a.vagas.length > 0 && (
                      <span className="text-xs text-slate-600">{a.vagas.join(", ")}</span>
                    )}
                    <label className="text-xs flex items-center gap-1">
                      <input type="checkbox" checked={a.dupla} onChange={() => handleToggleDupla(a.id)} />
                      <span>Vaga dupla</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="p-4 bg-white rounded-2xl shadow space-y-2">
            <h2 className="font-semibold">Resumo</h2>
            <div className="text-sm grid grid-cols-2 gap-y-1">
              <span>Aptos pendentes:</span>
              <span className="font-medium text-right">{pendingCount}</span>
              <span>Duplas pendentes:</span>
              <span className="font-medium text-right">{apartments.filter((a) => a.dupla && !a.sorteado).length}</span>
              <span>Simples pendentes:</span>
              <span className="font-medium text-right">{apartments.filter((a) => !a.dupla && !a.sorteado).length}</span>
            </div>
            <div className="mt-2">
              <h3 className="text-sm font-semibold mb-1">Ocupação por região</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {FLOORS.map((f) =>
                  SIDES.map((s) => (
                    <div key={`${f}-${s}`} className="flex items-center justify-between px-2 py-1 rounded bg-slate-100">
                      <span>
                        {f}-{s}
                      </span>
                      <span className="font-mono">{counts.get(`${f}-${s}`) || 0}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Garagens */}
        <section className="space-y-6">
          {FLOORS.map((floor) => (
            <div key={floor} className="bg-white rounded-2xl shadow p-4">
              <h2 className="font-semibold mb-3">{floor}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {SIDES.map((side) => (
                  <div key={`${floor}-${side}`} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        Lado {side} <span className="text-xs text-slate-500">(pares: 1-2, 3-4, 5-6)</span>
                      </h3>
                      <span className="text-xs text-slate-500">
                        Ocupadas: {
                          garage.spots.filter((s) => s.floor === floor && s.side === side && s.occupiedBy).length
                        }
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {POSITIONS.map((pos) => {
                        const spot = garage.spots.find((s) => s.floor === floor && s.side === side && s.pos === pos);
                        const pair = garage.pairs[spot.parId];
                        const isReserved = pair?.reservedFor != null;
                        const color = spot.blocked
                          ? "bg-slate-300 text-slate-600"
                          : spot.occupiedBy
                          ? "bg-emerald-600 text-white"
                          : isReserved
                          ? "bg-amber-200 text-amber-950"
                          : "bg-slate-100";
                        return (
                          <button
                            key={spot.id}
                            className={`h-16 rounded-lg flex flex-col items-center justify-center ${color} border hover:shadow`}
                            onClick={() => toggleBlockSpot(spot.id)}
                            title={`$${spot.id}\nPar: ${spot.parId}${pair?.reservedFor ? `\nReservado p/ apto ${pair.reservedFor}` : ""}${
                              spot.occupiedBy ? `\nOcupado por apto ${spot.occupiedBy}` : ""
                            }`}
                          >
                            <span className="font-mono text-sm">{side + pos}</span>
                            <span className="text-[10px] leading-none">{spot.id}</span>
                            {spot.occupiedBy && (
                              <span className="text-[10px] leading-none mt-0.5">apto {spot.occupiedBy}</span>
                            )}
                            {!spot.occupiedBy && isReserved && (
                              <span className="text-[10px] leading-none mt-0.5">reservado</span>
                            )}
                            {spot.blocked && (
                              <span className="text-[10px] leading-none mt-0.5">bloqueada</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Clique para bloquear/desbloquear uma vaga.</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="text-xs text-slate-500 pt-4 pb-2">
          <p>
            Regras implementadas conforme README. Pré-processamento de duplas ocorre no primeiro "Sortear" após um reset.
            Logs detalhados no console do navegador.
          </p>
        </footer>
      </div>
    </div>
  );
}
