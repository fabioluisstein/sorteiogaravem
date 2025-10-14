import React, { useMemo, useRef, useState } from "react";

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

/* ===== Configuração ===== */
const FLOORS = ["G1", "G2", "G3"];
const SIDES_BY_FLOOR = { G1: ["A", "B"], G2: ["C", "D"], G3: ["E", "F"] };
const POSITIONS = [1, 2, 3, 4, 5, 6];
const NATURAL_PAIRS = [
  [1, 2],
  [3, 4],
  [5, 6],
];

/* ===== Paleta: estados das vagas ===== */
const COLORS = {
  free: "#16a34a",      // verde (livre)
  selected: "#60a5fa",  // azul claro (escolhida/ocupada)
  reserved: "#facc15",  // amarelo (par reservado para dupla)
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
        const [p1, p2] = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
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
      const num = `${andar}0${col}`; // 101..104, 201..204, ..., 701..704
      list.push({ id: num, dupla: false, sorteado: false, vagas: [], ativo: true });
    }
  }
  return list;
}

/* ===== Componente principal ===== */
export default function GarageLotteryApp() {
  /* Estado */
  const [seed, setSeed] = useState(12345);
  const rng = useRef(mulberry32(12345));
  const [compact, setCompact] = useState(true); // densidade de layout
  const [garage, setGarage] = useState(buildInitialGarage());
  const [apartments, setApartments] = useState(buildInitialApartments);
  const [doubleReservations, setDoubleReservations] = useState(null); // aptId -> parId
  const [preprocessed, setPreprocessed] = useState(false);

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

  /* Pré-processo oculto de duplas */
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
      state.spots.find((s) => s.id === chosen.aId).occupiedBy = `RESERVA-${aptId}`;
      state.spots.find((s) => s.id === chosen.bId).occupiedBy = `RESERVA-${aptId}`;
      log("Reservado par", chosen.id, "para apto", aptId);
    }
    const restored = state.spots.map((s) => ({ ...s, occupiedBy: null }));
    const newPairs = { ...garage.pairs };
    for (const aptId in reservations)
      newPairs[reservations[aptId]] = {
        ...newPairs[reservations[aptId]],
        reservedFor: aptId,
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
      let pair = parId ? garage.pairs[parId] : pick(getFreePairs(garage));
      if (!pair) return alert(`Sem par livre para ${apt.id}`);
      setGarage((prev) => {
        const spots = prev.spots.map((s) =>
          s.id === pair.aId || s.id === pair.bId ? { ...s, occupiedBy: apt.id } : s
        );
        const pairs = { ...prev.pairs };
        if (pairs[pair.id]?.reservedFor === apt.id) pairs[pair.id].reservedFor = null;
        return { spots, pairs };
      });
      setApartments((prev) =>
        prev.map((a) =>
          a.id === apt.id ? { ...a, sorteado: true, vagas: [pair.aId, pair.bId] } : a
        )
      );
    } else {
      const free = garage.spots.filter((s) => !s.blocked && !s.occupiedBy && !garage.pairs[s.parId]?.reservedFor);
      const spot = chooseBalancedSpot(free, garage);
      if (!spot) return alert("Sem vaga disponível.");
      setGarage((prev) => ({
        ...prev,
        spots: prev.spots.map((s) =>
          s.id === spot.id ? { ...s, occupiedBy: apt.id } : s
        ),
      }));
      setApartments((prev) =>
        prev.map((a) =>
          a.id === apt.id ? { ...a, sorteado: true, vagas: [spot.id] } : a
        )
      );
    }
  };

  /* Reset */
  const clearAll = () => {
    setGarage(buildInitialGarage());
    setDoubleReservations(null);
    setPreprocessed(false);
    setApartments(buildInitialApartments());
  };

  /* Handlers */
  const toggleDupla = (id) => {
    setApartments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dupla: !a.dupla } : a))
    );
    setDoubleReservations(null);
    setPreprocessed(false);
  };

  const toggleParticipa = (id) => {
    setApartments((prev) => {
      const target = prev.find((a) => a.id === id);
      const willBeActive = !(target?.ativo ?? true); // invertido
      // se vamos desativar e o apto já estava sorteado, precisamos liberar as vagas
      if (!willBeActive && target?.sorteado && target.vagas?.length) {
        setGarage((gPrev) => ({
          ...gPrev,
          spots: gPrev.spots.map((s) =>
            target.vagas.includes(s.id) ? { ...s, occupiedBy: null } : s
          ),
        }));
      }
      // reset de pré-processamento, pois muda o conjunto participante
      setDoubleReservations(null);
      setPreprocessed(false);
      return prev.map((a) =>
        a.id === id
          ? { ...a, ativo: willBeActive, ...(willBeActive ? {} : { sorteado: false, vagas: [] }) }
          : a
      );
    });
  };

  const onSeed = (v) => {
    setSeed(v);
    resetRng(v);
  };

  const pending = apartments.filter((a) => a.ativo && !a.sorteado).length;

  /* ===== Helpers de UI ===== */
  const spotBgColor = (spot) => {
    const pair = garage.pairs[spot.parId];
    if (spot.blocked) return COLORS.blocked;
    if (spot.occupiedBy) return COLORS.selected;
    if (pair?.reservedFor) return COLORS.reserved;
    return COLORS.free;
  };
  const spotTextColor = (spot) => {
    const bg = spotBgColor(spot);
    // contraste mínimo legível
    return bg === COLORS.free || bg === COLORS.reserved ? "#0b1220" : "#ffffff";
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
        .leftSticky { position:sticky; top:16px; align-self:start; max-height:calc(100vh - 32px); overflow:auto; }

        @media (max-width: 1200px) {
          .twoCols { grid-template-columns: 1fr; }
          .leftSticky { position:static; max-height:none; }
        }
      `}</style>

      <div className={`wrap ${compact ? "compact" : ""}`}>
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
                        <label
                          style={{
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            opacity: a.ativo ? 1 : 0.7,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={a.dupla}
                            onChange={() => toggleDupla(a.id)}
                            disabled={!a.ativo}
                          />
                          <span>Dupla</span>
                        </label>
                        <label
                          style={{
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={a.ativo}
                            onChange={() => toggleParticipa(a.id)}
                          />
                          <span>Participa</span>
                        </label>
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
                          {a.vagas.join(", ")}
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
                      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {SIDES_BY_FLOOR[floor].map((side) => (
                      <div
                        key={`${floor}-${side}`}
                        style={{
                          border: "1px solid #1e293b",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Lado {side}</h3>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(6, minmax(0,1fr))",
                            gap: 8,
                          }}
                        >
                          {POSITIONS.map((pos) => {
                            const spot = garage.spots.find(
                              (s) => s.floor === floor && s.side === side && s.pos === pos
                            );
                            const bg = spotBgColor(spot);
                            const color = spotTextColor(spot);
                            return (
                              <div
                                key={spot.id}
                                title={`${spot.id}`}
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
                                }}
                              >
                                <span>{side + pos}</span>
                                {spot.occupiedBy && (
                                  <span style={{ fontSize: 12 }}>apto {spot.occupiedBy}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
