import React, { useState } from 'react';
import { SorteioSimples } from '../SorteioSimples.js';

const SorteioSimplesComponent = () => {

    // ESTADOS NORMAIS
    const [sorteio] = useState(() => new SorteioSimples());
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);

    // ESTADOS DO PROCESSO SIMULADO
    const [showModal, setShowModal] = useState(false);
    const [progressoTexto, setProgressoTexto] = useState('');
    const [progressoPercentual, setProgressoPercentual] = useState(0);
    const [listaSorteio, setListaSorteio] = useState([]);
    const [indiceAtual, setIndiceAtual] = useState(0);
    const [processando, setProcessando] = useState(false);
    const [resultadoFinalTemp, setResultadoFinalTemp] = useState(null);

    // EMBARALHAR ORDEM DOS APARTAMENTOS
    const embaralhar = (array) => {
        let a = [...array];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // Delay rápido
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // EXECUTAR SORTEIO
    const executarSorteio = () => {
        setLoading(true);
        sorteio.resetar();

        // Sorteio real (instantâneo)
        const resultadoReal = sorteio.sorteio();

        // 🔥 Embaralha ordem de apresentação na modal
        const ordemRandomica = embaralhar(resultadoReal.resultados);

        setListaSorteio(ordemRandomica);
        setResultadoFinalTemp(resultadoReal);

        // Configura modal inicial
        setIndiceAtual(0);
        setProgressoPercentual(0);
        setProgressoTexto("Pronto para iniciar!");
        setShowModal(true);
        setProcessando(false);

        // Não mostrar resultados ainda
        setResultado(null);
    };

    // PROCESSAR PRÓXIMO APARTAMENTO (somente quando clicar)
    const processarProximo = async () => {
        if (processando) return;

        setProcessando(true);
        setProgressoTexto("Sorteando...");

        const item = listaSorteio[indiceAtual];
        const delayMs = Math.floor(Math.random() * 1500) + 1500; // 1500–3000 ms

        await delay(delayMs);

        setProgressoTexto(
            `Apto ${item.apartamento} → vaga(s): ${item.vagas.join(', ')}`
        );

        const pct = Math.round(((indiceAtual + 1) / listaSorteio.length) * 100);
        setProgressoPercentual(pct);

        setProcessando(false);

        // Último apartamento → não avança
        if (indiceAtual + 1 === listaSorteio.length) {
            return;
        }


        // Avança para o próximo
        setIndiceAtual(indiceAtual + 1);
    };

    // RESETAR
    const resetarSorteio = () => {
        sorteio.resetar();
        setResultado(null);
    };

    // PDF com layout profissional otimizado para impressão
    const gerarPDF = () => {
        if (!resultado || !resultado.sucesso) {
            alert('❌ Erro: Execute um sorteio primeiro antes de imprimir!');
            return;
        }

        const printWindow = window.open('', '_blank');
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');

        // Separar e organizar resultados
        const duplos = resultado.resultados.filter(r => r.tipo === 'duplo').sort((a, b) => a.apartamento - b.apartamento);
        const estendidos = resultado.resultados.filter(r => r.tipo === 'estendido').sort((a, b) => a.apartamento - b.apartamento);
        const simples = resultado.resultados.filter(r => r.tipo === 'simples').sort((a, b) => a.apartamento - b.apartamento);

        // Função para destacar apt 303
        const highlight303 = (apto) => apto === 303 ? 'background: #ffe8e8; border: 2px solid #e74c3c;' : '';
        const badge303 = (apto) => apto === 303 ? '<span style="color:#e74c3c;font-weight:bold;font-size:11px;margin-left:6px;">Regra Especial</span>' : '';

        const conteudoHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sorteio de Garagens — Edifício Flor de Lis</title>
            <style>
                @page { size: A4; margin: 1.5cm; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #2c3e50; font-size: 12px; }
                .header { text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 15px; margin-bottom: 25px; }
                .header h1 { font-size: 22px; color: #2c3e50; margin-bottom: 8px; font-weight: 700; }
                .header .subtitle { font-size: 16px; color: #34495e; font-weight: 600; }
                .header .datetime { font-size: 14px; color: #7f8c8d; margin-top: 8px; }
                .legend { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px 15px; margin-bottom: 18px; font-size: 11px; }
                .legend span { display: inline-block; margin-right: 18px; }
                .legend .duplo { color: #e74c3c; font-weight: bold; }
                .legend .estendido { color: #f39c12; font-weight: bold; }
                .legend .simples { color: #27ae60; font-weight: bold; }
                .legend .especial { color: #e74c3c; font-weight: bold; }
                .summary-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .summary-item { font-size: 11px; }
                .summary-item strong { color: #2c3e50; font-size: 12px; }
                .section { margin-bottom: 25px; page-break-inside: avoid; }
                .section-header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 10px 15px; border-radius: 6px; margin-bottom: 12px; font-weight: 600; font-size: 14px; text-align: center; }
                .section-header.duplos { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); }
                .section-header.estendidos { background: linear-gradient(135deg, #f39c12 0%, #d68910 100%); }
                .section-header.simples { background: linear-gradient(135deg, #27ae60 0%, #229954 100%); }
                .results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .result-item { background: #ffffff; border: 1px solid #bdc3c7; border-radius: 5px; padding: 10px; display: flex; justify-content: space-between; align-items: center; min-height: 40px; transition: all 0.2s ease; }
                .apartment { font-weight: 700; font-size: 13px; color: #2c3e50; }
                .spots { color: #34495e; font-size: 12px; font-weight: 500; }
                .pair-info { font-size: 9px; color: #7f8c8d; font-style: italic; text-align: right; line-height: 1.2; }
                .footer { margin-top: 30px; text-align: center; border-top: 2px solid #ecf0f1; padding-top: 15px; font-size: 10px; color: #7f8c8d; }
                .print-controls { text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                .print-btn { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 12px 30px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 5px; transition: all 0.2s ease; }
                .print-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3); }
                .close-btn { background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); }
                @media print { .print-controls { display: none !important; } body { font-size: 11px; } .section { page-break-inside: avoid; margin-bottom: 20px; } .results-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; } .result-item { min-height: 35px; padding: 8px; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏢 SORTEIO DE GARAGENS — EDIFÍCIO FLOR DE LIS</h1>
                <div class="subtitle">Edifício Flor de Lis</div>
                <div class="datetime">${dataFormatada} • ${horaFormatada}</div>
            </div>
            <div class="legend">
                <span class="duplo">■ Duplo</span>
                <span class="estendido">■ Estendido</span>
                <span class="simples">■ Simples</span>
                <span class="especial">■ Regra Especial: apto 303</span>
            </div>
            <div class="summary-box">
                <div class="summary-item">
                    <strong>📊 Resumo do Sorteio:</strong><br>
                    • Total de apartamentos: ${resultado.estatisticas.apartamentos}/${resultado.estatisticas.apartamentos}<br>
                    • Total de vagas atribuídas: ${resultado.estatisticas.vagasOcupadas}/${sorteio.vagas.length}<br>
                    • Vagas livres: ${resultado.estatisticas.vagasLivres}
                </div>
                <div class="summary-item">
                    <strong>🎯 Distribuição por Tipo:</strong><br>
                    • Apartamentos — Vagas Duplas: ${duplos.length}/${duplos.length}<br>
                    • Apartamentos — Vagas Duplas (Estendidas): ${estendidos.length}/${estendidos.length}<br>
                    • Apartamentos — Vaga Simples: ${simples.length}/${simples.length}
                </div>
            </div>
            <div class="section">
                <div class="section-header duplos">🏢 APARTAMENTOS — VAGAS DUPLAS (${duplos.length})</div>
                <div class="results-grid">
                    ${duplos.map(item => {
            const par = sorteio.pares.find(p => [p.vagaA, p.vagaB].includes(item.vagas[0]) && [p.vagaA, p.vagaB].includes(item.vagas[1]));
            return `<div class="result-item" style="${highlight303(item.apartamento)}">
                            <span class="apartment">Apto ${item.apartamento} ${badge303(item.apartamento)}</span>
                            <div style="text-align: right;">
                                <div class="spots">Vagas ${item.vagas.join(', ')}</div>
                                <div class="pair-info">${par ? par.id : 'Par não identificado'}</div>
                            </div>
                        </div>`;
        }).join('')}
                </div>
            </div>
            <div class="section">
                <div class="section-header estendidos">🏗️ APARTAMENTOS — VAGAS DUPLAS (ESTENDIDAS) (${estendidos.length})</div>
                <div class="results-grid">
                    ${estendidos.map(item => `<div class="result-item" style="${highlight303(item.apartamento)}">
                        <span class="apartment">Apto ${item.apartamento} ${badge303(item.apartamento)}</span>
                        <div class="spots">Vaga ${item.vagas[0]}</div>
                    </div>`).join('')}
                </div>
            </div>
            <div class="section">
                <div class="section-header simples">🏠 APARTAMENTOS — VAGA SIMPLES (${simples.length})</div>
                <div class="results-grid">
                    ${simples.map(item => `<div class="result-item" style="${highlight303(item.apartamento)}">
                        <span class="apartment">Apto ${item.apartamento} ${badge303(item.apartamento)}</span>
                        <div class="spots">Vaga ${item.vagas[0]}</div>
                    </div>`).join('')}
                </div>
            </div>
            <div class="footer">
                <p><strong>Documento gerado automaticamente pelo Sistema de Sorteio Simples</strong></p>
                <p>Edifício Flor de Lis • ${dataFormatada} ${horaFormatada}</p>
            </div>
            <div class="print-controls">
                <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
                <button class="print-btn close-btn" onclick="window.close()">❌ Fechar</button>
            </div>
            <script>
                window.onload = function() { document.querySelector('.print-btn').focus(); };
                document.addEventListener('keydown', function(e) { if (e.ctrlKey && e.key === 'p') { e.preventDefault(); window.print(); } });
            </script>
        </body>
        </html>
        `;
        printWindow.document.write(conteudoHTML);
        printWindow.document.close();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>

            {/* ANIMAÇÃO GLOBAL */}
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.17); background-color: #ffe8a1; }
                    100% { transform: scale(1); }
                }
                /* Layout responsivo para telefones */
                .controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
                .controls > button { flex: 0 1 auto; }
                .page-title { font-size: 36px; margin-bottom: 12px; line-height: 1.05; }
                @media (max-width: 600px) {
                    .page-title { font-size: 28px; }
                    .controls { flex-direction: column; align-items: stretch; }
                    .controls > button { width: 100% !important; margin-right: 0 !important; }
                    .summary-box { grid-template-columns: 1fr !important; }
                    .results-grid { grid-template-columns: repeat(1, 1fr) !important; }
                    .modal-inner { width: 90% !important; }
                }
                `}
            </style>

            <h1>🎲 Sorteio Garagem — Edifício Flor de Lis</h1>

            {/* Botões */}
            <div className="controls" style={{ marginBottom: '20px' }}>
                <button
                    onClick={executarSorteio}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '5px',
                        marginRight: '10px',
                        cursor: loading ? 'not-allowed' : 'pointer'
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
                        borderRadius: '5px',
                        marginRight: '10px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    🔄 Resetar
                </button>

                <button
                    onClick={gerarPDF}
                    disabled={!resultado || !resultado.sucesso || loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: resultado && resultado.sucesso ? '#2196F3' : '#aaa',
                        color: 'white',
                        borderRadius: '5px'
                    }}
                >
                    🖨️ Imprimir PDF
                </button>
            </div>

            {/* -------- RESULTADO FINAL ORIGINAL (SEM ALTERAÇÕES) -------- */}
            {resultado && (
                <div>
                    {resultado.sucesso ? (
                        <div>

                            <div style={{
                                backgroundColor: '#e8f5e8',
                                padding: '15px',
                                borderRadius: '5px',
                                border: '1px solid #4CAF50',
                                marginBottom: '20px'
                            }}>
                                <h3>📊 Estatísticas do Sorteio</h3>
                                <p><strong>Vagas Ocupadas:</strong> {resultado.estatisticas.vagasOcupadas}/42</p>
                                <p><strong>Apartamentos Sorteados:</strong> {resultado.estatisticas.apartamentosSorteados}/28</p>
                                <p><strong>Vagas Livres:</strong> {resultado.estatisticas.vagasLivres}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>

                                <div style={{ flex: 1 }}>
                                    <h4>🏢 Duplos</h4>
                                    {resultado.resultados.filter(r => r.tipo === 'duplo')
                                        .map(r => (
                                            <p key={r.apartamento}>
                                                <strong>Apto {r.apartamento}:</strong> {r.vagas.join(', ')}
                                            </p>
                                        ))}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h4>🏗️ Estendidos</h4>
                                    {resultado.resultados.filter(r => r.tipo === 'estendido')
                                        .map(r => (
                                            <p key={r.apartamento}>
                                                <strong>Apto {r.apartamento}:</strong> {r.vagas[0]}
                                            </p>
                                        ))}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h4>🏠 Simples</h4>
                                    {resultado.resultados.filter(r => r.tipo === 'simples')
                                        .map(r => (
                                            <p key={r.apartamento}>
                                                <strong>Apto {r.apartamento}:</strong> {r.vagas[0]}
                                            </p>
                                        ))}
                                </div>
                            </div>

                            {resultado.estatisticas.vagasLivres > 0 && (
                                <div style={{
                                    backgroundColor: '#f8d7da',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    border: '1px solid #dc3545',
                                    marginTop: '20px'
                                }}>
                                    <h4>🚫 Vagas Livres</h4>
                                    <p>{sorteio.vagas.filter(v => !v.ocupada).map(v => v.id).join(', ')}</p>
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
                    <p>28 apartamentos • 42 vagas</p>
                </div>
            )}

            {/* -------- MODAL -------- */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999
                }}>
                    <div className="modal-inner" style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        width: '420px',
                        textAlign: 'center',
                        boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                    }}>
                        <h3>⏳ Sorteio de Garagens</h3>

                        <img
                            src="https://i.gifer.com/ZZ5H.gif"
                            alt="loading"
                            style={{ width: '80px', margin: '20px auto' }}
                        />

                        <p
                            style={{
                                fontSize: '20px',
                                marginBottom: '15px',
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: progressoTexto.includes("Apto") ? '#fff7d6' : '#eee',
                                border: progressoTexto.includes("Apto") ? '2px solid #ffcc00' : '1px solid #ccc',
                                fontWeight: 'bold',
                                color: '#333',
                                animation: progressoTexto.includes("Apto") ? 'pulse 0.6s ease-in-out 3' : 'none'
                            }}
                        >
                            {progressoTexto}
                        </p>

                        <div style={{
                            width: '100%',
                            height: '15px',
                            backgroundColor: '#eee',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progressoPercentual}%`,
                                height: '100%',
                                backgroundColor: '#4CAF50',
                                transition: 'width 0.3s'
                            }} />
                        </div>

                        <p style={{ marginTop: '10px', fontSize: '14px' }}>
                            {progressoPercentual}% concluído
                        </p>

                        <button
                            onClick={
                                indiceAtual + 1 === listaSorteio.length
                                    ? () => {
                                        // 🔥 Só aqui finaliza tudo
                                        setShowModal(false);
                                        setLoading(false);
                                        setResultado(resultadoFinalTemp);
                                    }
                                    : processarProximo
                            }

                            disabled={processando}
                            style={{
                                marginTop: '20px',
                                padding: '12px 28px',
                                fontSize: '16px',
                                backgroundColor: processando ? '#aaa' : '#2196F3',
                                color: 'white',
                                borderRadius: '5px',
                                cursor: processando ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {indiceAtual + 1 === listaSorteio.length ? "Finalizar" : "Próximo →"}
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
};

export default SorteioSimplesComponent;
