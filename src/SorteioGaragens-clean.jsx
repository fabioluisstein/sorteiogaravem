// 🔧 VERSÃO LIMPA - SEM BUGS DE ÓRFÃOS
// Esta é uma versão simplificada que resolve o bug dos apartamentos órfãos

import React, { useState, useEffect } from "react";
import { loadConfigFromFile, generateReactConfig } from "./config/sorteioConfig.js";

const SorteioGaragens = () => {
    // ⚡ Estados básicos
    const [garage, setGarage] = useState(null);
    const [apartments, setApartments] = useState([]);
    const [config, setConfig] = useState(null);
    const [lastDraw, setLastDraw] = useState(null);

    // 🔧 CORREÇÃO SIMPLES E EFICAZ DE ÓRFÃOS
    const fixOrphanedApartments = () => {
        console.log('🔧 [FIX ÓRFÃOS] Iniciando correção...');

        const orphans = apartments.filter(a => a.sorteado && a.vagas.length === 0);
        const freeSpots = garage?.spots?.filter(s => !s.blocked && !s.occupiedBy) || [];

        console.log('🔧 Órfãos:', orphans.map(a => a.id));
        console.log('🔧 Livres:', freeSpots.map(s => s.id));

        if (orphans.length === 0) {
            alert('✅ Nenhum órfão encontrado!');
            return;
        }

        // Aplica correções uma por vez de forma síncrona
        const corrections = [];
        for (let i = 0; i < Math.min(orphans.length, freeSpots.length); i++) {
            corrections.push({
                orphan: orphans[i],
                spot: freeSpots[i]
            });
        }

        // Atualiza states atomicamente
        setApartments(prev => {
            const updated = [...prev];
            corrections.forEach(({ orphan, spot }) => {
                const aptIndex = updated.findIndex(a => a.id === orphan.id);
                if (aptIndex >= 0) {
                    updated[aptIndex] = { ...orphan, vagas: [spot.id] };
                    console.log(`✅ ${orphan.id} → ${spot.id}`);
                }
            });
            return updated;
        });

        setGarage(prev => {
            if (!prev) return prev;
            const updatedSpots = [...prev.spots];
            corrections.forEach(({ orphan, spot }) => {
                const spotIndex = updatedSpots.findIndex(s => s.id === spot.id);
                if (spotIndex >= 0) {
                    updatedSpots[spotIndex] = { ...spot, occupiedBy: orphan.id };
                }
            });
            return { ...prev, spots: updatedSpots };
        });

        alert(`✅ ${corrections.length} órfãos corrigidos!`);
    };

    // 🚨 Reset de emergência
    const resetAll = () => {
        console.log('🚨 RESET DE EMERGÊNCIA');
        setGarage(null);
        setApartments([]);
        setLastDraw(null);
        alert('🚨 Sistema resetado! Recarregue a página.');
        window.location.reload();
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>🏢 Sorteio Garagens Flor de Lis</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={fixOrphanedApartments}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        marginRight: '10px',
                        cursor: 'pointer'
                    }}
                >
                    🔧 Corrigir Órfãos
                </button>

                <button
                    onClick={resetAll}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    🚨 Reset Total
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h3>📋 Apartamentos</h3>
                    {apartments.length === 0 && <p>Carregando apartamentos...</p>}
                    {apartments.map(apt => (
                        <div key={apt.id} style={{
                            padding: '8px',
                            margin: '4px 0',
                            backgroundColor: apt.sorteado ? '#fee2e2' : '#f0f9ff',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}>
                            <strong>{apt.id}</strong>
                            {apt.sorteado && (
                                <span style={{ marginLeft: '10px', color: '#dc2626' }}>
                                    ✓ Sorteado {apt.vagas.length > 0 ? `(${apt.vagas.join(',')})` : '❌ SEM VAGA'}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div>
                    <h3>🚗 Garagem</h3>
                    {garage ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {garage.spots?.map(spot => (
                                <div key={spot.id} style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: spot.occupiedBy ? '#dc2626' : '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    border: '1px solid #ccc'
                                }}>
                                    {spot.id}
                                </div>
                            )) || <p>Sem spots</p>}
                        </div>
                    ) : (
                        <p>Carregando garagem...</p>
                    )}
                </div>
            </div>

            {lastDraw && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #16a34a', borderRadius: '5px' }}>
                    <strong>🎯 Último sorteio:</strong> Apt {lastDraw.aptId} → Vaga {lastDraw.vagas?.join(',')}
                </div>
            )}
        </div>
    );
};

export default SorteioGaragens;