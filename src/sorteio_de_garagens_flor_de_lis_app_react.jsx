import React, { useMemo, useRef, useState } from "react";

/* Utilidades de aleatoriedade */
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

/* Configuração dos andares e lados */
const FLOORS = ["G1", "G2", "G3"];
const SIDES_BY_FLOOR = {
  G1: ["A", "B"],
  G2: ["C", "D"],
  G3: ["E", "F"],
};
const POSITIONS = [1, 2, 3, 4, 5, 6];
const NATURAL_PAIRS = [
  [1, 2],
  [3, 4],
  [5, 6],
];

/* Construtor inicial da garagem */
function buildInitialGarage() {
  const spots = [];
  const pairs = {};
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
        const pair = NATURAL_PAIRS.find(([a, b]) => a === pos || b === pos);
        const parId = `${floor}-${side}-${pair[0]}-${pair[1]}`;
        spots.push({
          id: `${floor}-${side}${pos}`,
          floor,
          side,
          pos,
          parId,
          blocked: false,
          occupiedBy: null,
        });
      }
    }
  }
  return { spots, pairs };
}

export default function GarageLotteryApp() {
  const [seed, setSeed] = useState(12345);
  const randRef = useRef(mulberry32(12345));
  const [garage, setGarage] = useState(buildInitialGarage());
  const [apartments, setApartments] = useState(() => {
    const list = [];
    for (let i = 101; i <= 112; i++)
      list.push({ id: String(i), dupla: false, sorteado: false, vagas: [] });
    for (let i = 201; i <= 212; i++)
      list.push({ id: String(i), dupla: false, sorteado: false, vagas: [] });
    for (let i = 301; i <= 312; i++)
      list.push({ id: String(i), dupla: false, sorteado: false, vagas: [] });
    return list;
  });
  const [doubleReservations, setDoubleReservations] = useState(null);
  const [preprocessed, setPreprocessed] = useState(false);

  const log = (...args) => console.log("[Sorteio]", ...args);
  const resetRng = (newSeed) => (randRef.current = mulberry32(Number(newSeed) || 0));
  const pickRandom = (arr) => (!arr.length ? null : arr[Math.floor(randRef.current() * arr.length)]);

  const countByRegion = (state) => {
    const map = new Map();
    for (const f of FLOORS) for (const s of SIDES_BY_FLOOR[f]) map.set(`${f}-${s}`, 0);
    for (const sp of state.spots) {
      if (sp.occupiedBy)
        map.set(`${sp.floor}-${sp.side}`, (map.get(`${sp.floor}-${sp.side}`) || 0) + 1);
    }
    return map;
  };

  const getFreePairs = (state) => {
    const { spots, pairs } = state;
    const freePairs = [];
    for (const parId in pairs) {
      const par = pairs[parId];
      const a = spots.find((s) => s.id === par.aId);
      const b = spots.find((s) => s.id === par.bId);
      if (!a.occupiedBy && !b.occupiedBy && !a.blocked && !b.blocked) freePairs.push(par);
    }
    return freePairs;
  };

  const chooseBalancedPair = (pairsList, state) => {
    const regionCounts = countByRegion(state);
    let min = Math.min(...pairsList.map((p) => regionCounts.get(`${p.floor}-${p.side}`) || 0));
    const candidates = pairsList.filter(
      (p) => (regionCounts.get(`${p.floor}-${p.side}`) || 0) === min
    );
    return pickRandom(candidates);
  };

  const runPreprocessIfNeeded = () => {
    if (preprocessed && doubleReservations) return;
    const state = structuredClone({ spots: garage.spots, pairs: garage.pairs });
    const duplos = apartments.filter((a) => a.dupla).map((a) => a.id);
    const freePairs = getFreePairs(state);
    if (duplos.length > freePairs.length) {
      alert(`Não há pares suficientes: duplas=${duplos.length}, pares livres=${freePairs.length}`);
      return;
    }
    const duplosOrder = seededShuffle(duplos, randRef.current);
    const reservations = {};
    for (const aptId of duplosOrder) {
      const free = getFreePairs(state);
      const chosen = chooseBalancedPair(free, state);
      reservations[aptId] = chosen.id;
      state.spots.find((s) => s.id === chosen.aId).occupiedBy = `RESERVA-${aptId}`;
      state.spots.find((s) => s.id === chosen.bId).occupiedBy = `RESERVA-${aptId}`;
      log("Reservado par", chosen.id, "para apto", aptId);
    }
    const restored = state.spots.map((s) => ({ ...s, occupiedBy: null }));
    const newPairs = { ...garage.pairs };
    for (const aptId in reservations)
      newPairs[reservations[aptId]] = { ...newPairs[reservations[aptId]], reservedFor: aptId };
    setGarage((prev) => ({ spots: restored, pairs: newPairs }));
    setDoubleReservations(reservations);
    setPreprocessed(true);
  };

  const drawOne = () => {
    runPreprocessIfNeeded();
    const pendentes = apartments.filter((a) => !a.sorteado);
    if (!pendentes.length) return alert("Todos os apartamentos foram sorteados.");
    const apt = pickRandom(pendentes);
    if (apt.dupla) {
      const parId = doubleReservations?.[apt.id];
      let chosenPair = parId ? garage.pairs[parId] : pickRandom(getFreePairs(garage));
      setGarage((prev) => {
        const spots = prev.spots.map((s) =>
          s.id === chosenPair.aId || s.id === chosenPair.bId
            ? { ...s, occupiedBy: apt.id }
            : s
        );
        const pairs = { ...prev.pairs };
        if (pairs[chosenPair.id]?.reservedFor === apt.id)
          pairs[chosenPair.id].reservedFor = null;
        return { spots, pairs };
      });
      setApartments((prev) =>
        prev.map((a) =>
          a.id === apt.id
            ? { ...a, sorteado: true, vagas: [chosenPair.aId, chosenPair.bId] }
            : a
        )
      );
    } else {
      let freeSpots = garage.spots.filter((s) => !s.blocked && !s.occupiedBy);
      const chosen = pickRandom(freeSpots);
      if (!chosen) return alert("Sem vaga disponível.");
      setGarage((prev) => ({
        ...prev,
        spots: prev.spots.map((s) =>
          s.id === chosen.id ? { ...s, occupiedBy: apt.id } : s
        ),
      }));
      setApartments((prev) =>
        prev.map((a) =>
          a.id === apt.id ? { ...a, sorteado: true, vagas: [chosen.id] } : a
        )
      );
    }
  };

  const clearAll = () => {
    setGarage(buildInitialGarage());
    setDoubleReservations(null);
    setPreprocessed(false);
    setApartments((prev) => prev.map((a) => ({ ...a, sorteado: false, vagas: [] })));
  };

  const handleToggleDupla = (id) => {
    setApartments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dupla: !a.dupla } : a))
    );
    setDoubleReservations(null);
    setPreprocessed(false);
  };

  const handleSeedChange = (v) => {
    setSeed(v);
    resetRng(v);
  };

  const pendingCount = apartments.filter((a) => !a.sorteado).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f14", color: "#eaeef2", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Sorteio de Garagens — Flor de Lis</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          type="number"
          style={{ padding: "6px 8px", border: "1px solid #334155", borderRadius: 6, background: "#0b0f14", color: "#eaeef2" }}
          value={seed}
          onChange={(e) => handleSeedChange(e.target.value)}
        />
        <button onClick={drawOne} style={{ padding: "8px 12px", borderRadius: 8, background: "#4f46e5", color: "white", border: 0 }}>
          Sortear ({pendingCount})
        </button>
        <button onClick={clearAll} style={{ padding: "8px 12px", borderRadius: 8, background: "#1f2937", color: "white", border: 0 }}>
          Limpar
        </button>
      </div>

      {/* Apartamentos responsivos (inline style -> dispensa Tailwind) */}
      <div style={{ background: "#0f172a", borderRadius: 16, padding: 16, marginBottom: 24, border: "1px solid #1e293b" }}>
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Apartamentos</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
          }}
        >
          {apartments.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid #1e293b",
                borderRadius: 10,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: "#0b1220",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco", fontSize: 13 }}>#{a.id}</span>
                <label style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={a.dupla}
                    onChange={() => handleToggleDupla(a.id)}
                  />
                  <span>Dupla</span>
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: a.dupla ? "#fef3c7" : "#d1fae5",
                    color: a.dupla ? "#92400e" : "#065f46",
                  }}
                >
                  {a.dupla ? "Dupla" : "Simples"}
                </span>
                {a.sorteado && (
                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 999, background: "#e0e7ff", color: "#3730a3" }}>
                    Sorteado
                  </span>
                )}
                {a.vagas.length > 0 && (
                  <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.vagas.join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {FLOORS.map((floor) => (
        <div key={floor} style={{ background: "#0f172a", borderRadius: 16, padding: 16, marginBottom: 24, border: "1px solid #1e293b" }}>
          <h2 style={{ fontWeight: 700, marginBottom: 12 }}>{floor}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {SIDES_BY_FLOOR[floor].map((side) => (
              <div key={`${floor}-${side}`} style={{ border: "1px solid #1e293b", borderRadius: 12, padding: 12 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Lado {side}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
                  {POSITIONS.map((pos) => {
                    const spot = garage.spots.find(
                      (s) => s.floor === floor && s.side === side && s.pos === pos
                    );
                    const pair = garage.pairs[spot.parId];
                    const color = spot.blocked
                      ? "#475569"
                      : spot.occupiedBy
                      ? "#059669"
                      : pair?.reservedFor
                      ? "#facc15"
                      : "#1f2937";
                    const colorTxt = spot.blocked || !spot.occupiedBy ? "#e2e8f0" : "white";
                    return (
                      <button
                        key={spot.id}
                        title={`${spot.id}\nPar: ${spot.parId}${
                          pair?.reservedFor ? `\nReservado p/ apto ${pair.reservedFor}` : ""
                        }${spot.occupiedBy ? `\nOcupado por apto ${spot.occupiedBy}` : ""}`}
                        style={{
                          height: 60,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #0b1220",
                          background: color,
                          color: colorTxt,
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span>{side + pos}</span>
                        {spot.occupiedBy && <span style={{ fontSize: 12 }}>apto {spot.occupiedBy}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
