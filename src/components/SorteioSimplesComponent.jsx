import React, { useState } from 'react';
import { SorteioSimples } from '../SorteioSimples.js';

const SorteioSimplesComponent = () => {
    const [sorteio] = useState(() => new SorteioSimples());
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);

    const executarSorteio = () => {
        setLoading(true);

        // Resetar antes de novo sorteio
        sorteio.resetar();

        setTimeout(() => {
            const novoResultado = sorteio.sorteio();
            setResultado(novoResultado);
            setLoading(false);
        }, 100);
    };

    const resetarSorteio = () => {
        sorteio.resetar();
        setResultado(null);
    };

    const gerarPDF = () => {
        if (!resultado || !resultado.sucesso) {
            alert('❌ Erro: Execute um sorteio primeiro antes de imprimir!');
            return;
        }

        // Criar uma nova janela para impressão
        const printWindow = window.open('', '_blank');

        // Obter data e hora atual
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');

        // Separar resultados por tipo
        const duplos = resultado.resultados.filter(r => r.tipo === 'duplo').sort((a, b) => a.apartamento - b.apartamento);
        const estendidos = resultado.resultados.filter(r => r.tipo === 'estendido').sort((a, b) => a.apartamento - b.apartamento);
        const simples = resultado.resultados.filter(r => r.tipo === 'simples').sort((a, b) => a.apartamento - b.apartamento);

        // Conteúdo HTML para impressão
        const conteudoHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resultado do Sorteio de Garagens - Flor de Lis</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2c3e50;
                    margin: 0 0 10px 0;
                    font-size: 24px;
                }
                .header .subtitle {
                    color: #7f8c8d;
                    font-size: 16px;
                }
                .info-box {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 25px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .section-title {
                    background-color: #34495e;
                    color: white;
                    padding: 10px 15px;
                    margin: 0 0 15px 0;
                    border-radius: 5px;
                    font-size: 18px;
                    font-weight: bold;
                }
                .duplos { background-color: #f39c12; }
                .estendidos { background-color: #27ae60; }
                .simples { background-color: #3498db; }
                
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 10px;
                }
                .result-item {
                    background-color: #ffffff;
                    border: 1px solid #bdc3c7;
                    border-radius: 5px;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .apartment {
                    font-weight: bold;
                    font-size: 16px;
                    color: #2c3e50;
                }
                .spots {
                    color: #7f8c8d;
                    font-size: 14px;
                }
                .pair-info {
                    color: #e67e22;
                    font-size: 12px;
                    font-style: italic;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    border-top: 1px solid #bdc3c7;
                    padding-top: 20px;
                    color: #7f8c8d;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 15px; }
                    .no-print { display: none; }
                    .section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏢 RESULTADO DO SORTEIO DE GARAGENS</h1>
                <div class="subtitle">Condomínio Flor de Lis</div>
                <div class="subtitle">Data: ${dataFormatada} • Hora: ${horaFormatada}</div>
            </div>

            <div class="info-box">
                <div class="info-grid">
                    <div>
                        <strong>📊 Resumo do Sorteio:</strong><br>
                        • Total de apartamentos: ${resultado.estatisticas.apartamentosSorteados}/28<br>
                        • Total de vagas atribuídas: ${resultado.estatisticas.vagasAtribuidas || duplos.length * 2 + estendidos.length + simples.length}/42<br>
                        • Vagas livres: ${resultado.estatisticas.vagasLivres}
                    </div>
                    <div>
                        <strong>🎯 Distribuição por Tipo:</strong><br>
                        • Apartamentos — Vagas Duplas: ${duplos.length}/14<br>
                        • Apartamentos — Vagas Duplas (Estendidas): ${estendidos.length}/4<br>
                        • Apartamentos — Vaga Simples: ${simples.length}/10
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title duplos">🏢 Apartamentos — Vagas Duplas (${duplos.length})</h2>
                <div class="results-grid">
                    ${duplos.map(item => `
                        <div class="result-item">
                            <span class="apartment">Apto ${item.apartamento}</span>
                            <div style="text-align: right;">
                                <div class="spots">Vagas ${item.vagas.join(', ')}</div>
                                ${item.par ? `<div class="pair-info">${item.par}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2 class="section-title estendidos">🏗️ Apartamentos — Vagas Duplas (Estendidas) (${estendidos.length})</h2>
                <div class="results-grid">
                    ${estendidos.map(item => `
                        <div class="result-item">
                            <span class="apartment">Apto ${item.apartamento}</span>
                            <div class="spots">Vaga ${item.vagas[0]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2 class="section-title simples">🏠 Apartamentos — Vaga Simples (${simples.length})</h2>
                <div class="results-grid">
                    ${simples.map(item => `
                        <div class="result-item">
                            <span class="apartment">Apto ${item.apartamento}</span>
                            <div class="spots">Vaga ${item.vagas[0]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="footer">
                <p>Documento gerado automaticamente pelo Sistema de Sorteio Simples</p>
                <p>Flor de Lis • ${dataFormatada} ${horaFormatada}</p>
            </div>

            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="
                    padding: 15px 30px;
                    font-size: 16px;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 10px;
                ">🖨️ Imprimir / Salvar PDF</button>
                
                <button onclick="window.close()" style="
                    padding: 15px 30px;
                    font-size: 16px;
                    background-color: #95a5a6;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">❌ Fechar</button>
            </div>
        </body>
        </html>`;

        printWindow.document.write(conteudoHTML);
        printWindow.document.close();
        printWindow.focus();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>🎲 Sistema de Sorteio Simples</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={executarSorteio}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {loading ? 'Sorteando...' : '🎲 Executar Sorteio'}
                </button>

                <button
                    onClick={resetarSorteio}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >
                    🔄 Resetar
                </button>

                <button
                    onClick={gerarPDF}
                    disabled={loading || !resultado || !resultado.sucesso}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: resultado && resultado.sucesso ? '#2196F3' : '#cccccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: (loading || !resultado || !resultado.sucesso) ? 'not-allowed' : 'pointer'
                    }}
                >
                    🖨️ Imprimir PDF
                </button>
            </div>

            {resultado && (
                <div>
                    {resultado.sucesso ? (
                        <div>
                            {/* Estatísticas */}
                            <div style={{
                                backgroundColor: '#e8f5e8',
                                padding: '15px',
                                borderRadius: '5px',
                                marginBottom: '20px',
                                border: '1px solid #4CAF50'
                            }}>
                                <h3>📊 Estatísticas do Sorteio</h3>
                                <p>✅ <strong>Vagas Ocupadas:</strong> {resultado.estatisticas.vagasOcupadas}/42</p>
                                <p>🏠 <strong>Apartamentos Sorteados:</strong> {resultado.estatisticas.apartamentosSorteados}/28</p>
                                <p>🅿️ <strong>Vagas Livres:</strong> {resultado.estatisticas.vagasLivres}</p>
                            </div>

                            {/* Resultados por Tipo */}
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                {/* Duplos */}
                                <div style={{
                                    backgroundColor: '#fff3cd',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    border: '1px solid #ffc107',
                                    flex: 1
                                }}>
                                    <h4>🏢 Apartamentos — Vagas Duplas</h4>
                                    {resultado.resultados
                                        .filter(r => r.tipo === 'duplo')
                                        .map(r => (
                                            <p key={r.apartamento} style={{ margin: '5px 0', fontSize: '14px' }}>
                                                <strong>Apto {r.apartamento}:</strong> Vagas {r.vagas.join(', ')} ({r.par})
                                            </p>
                                        ))}
                                </div>

                                {/* Estendidos */}
                                <div style={{
                                    backgroundColor: '#d4edda',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    border: '1px solid #28a745',
                                    flex: 1
                                }}>
                                    <h4>🏗️ Apartamentos — Vagas Duplas (Estendidas)</h4>
                                    {resultado.resultados
                                        .filter(r => r.tipo === 'estendido')
                                        .map(r => (
                                            <p key={r.apartamento} style={{ margin: '5px 0', fontSize: '14px' }}>
                                                <strong>Apto {r.apartamento}:</strong> Vaga {r.vagas[0]}
                                            </p>
                                        ))}
                                </div>

                                {/* Simples */}
                                <div style={{
                                    backgroundColor: '#d1ecf1',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    border: '1px solid #17a2b8',
                                    flex: 1
                                }}>
                                    <h4>🏠 Apartamentos — Vaga Simples</h4>
                                    {resultado.resultados
                                        .filter(r => r.tipo === 'simples')
                                        .map(r => (
                                            <p key={r.apartamento} style={{ margin: '5px 0', fontSize: '14px' }}>
                                                <strong>Apto {r.apartamento}:</strong> Vaga {r.vagas[0]}
                                            </p>
                                        ))}
                                </div>
                            </div>

                            {/* Resumo por Andar */}
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '15px',
                                borderRadius: '5px',
                                border: '1px solid #dee2e6'
                            }}>
                                <h4>🏬 Ocupação por Andar de Garagem</h4>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div>
                                        <strong>G1:</strong>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            Vagas 1-14 |
                                            Ocupadas: {sorteio.vagas.filter(v => v.andar === 'G1' && v.ocupada).length}/14
                                        </p>
                                    </div>
                                    <div>
                                        <strong>G2:</strong>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            Vagas 15-28 |
                                            Ocupadas: {sorteio.vagas.filter(v => v.andar === 'G2' && v.ocupada).length}/14
                                        </p>
                                    </div>
                                    <div>
                                        <strong>G3:</strong>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            Vagas 29-42 |
                                            Ocupadas: {sorteio.vagas.filter(v => v.andar === 'G3' && v.ocupada).length}/14
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Vagas Livres */}
                            {resultado.estatisticas.vagasLivres > 0 && (
                                <div style={{
                                    backgroundColor: '#f8d7da',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    border: '1px solid #dc3545',
                                    marginTop: '20px'
                                }}>
                                    <h4>🚫 Vagas Não Ocupadas</h4>
                                    <p style={{ fontSize: '14px' }}>
                                        Vagas livres: {sorteio.vagas
                                            .filter(v => !v.ocupada)
                                            .map(v => v.id)
                                            .join(', ')}
                                    </p>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: '#f8d7da',
                            padding: '15px',
                            borderRadius: '5px',
                            border: '1px solid #dc3545'
                        }}>
                            <h3>❌ Erro no Sorteio</h3>
                            <p>{resultado.erro}</p>
                        </div>
                    )}
                </div>
            )}

            {!resultado && (
                <div style={{
                    backgroundColor: '#e2e3e5',
                    padding: '30px',
                    borderRadius: '5px',
                    textAlign: 'center',
                    color: '#6c757d'
                }}>
                    <h3>🎯 Clique em "Executar Sorteio" para começar!</h3>
                    <p>Sistema com 28 apartamentos e 42 vagas de garagem</p>
                    <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
                        <li>14 apartamentos — vagas duplas (2 vagas cada)</li>
                        <li>4 apartamentos — vagas duplas estendidas (1 vaga estendida)</li>
                        <li>10 apartamentos — vaga simples (1 vaga normal)</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SorteioSimplesComponent;