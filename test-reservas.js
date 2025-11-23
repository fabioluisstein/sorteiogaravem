// Teste rápido das reservas especiais
import { sorteioConfig } from './src/config/sorteioConfig.js';

// Simula carregamento da configuração
const testConfig = `
# Configuração de teste
reservas_especiais=301=21,402=31
apartamentos_vagas_duplas=101,301
`;

async function testeReservasEspeciais() {
    console.log('🧪 TESTE DE RESERVAS ESPECIAIS');
    console.log('================================');

    try {
        // Carrega configuração
        await sorteioConfig.loadFromFile(testConfig);

        // Debug: mostra configuração carregada
        console.log('🔧 Config completa:', sorteioConfig.config);
        console.log('🔧 Apartamentos duplos:', sorteioConfig.apartamentosVagasDuplas);

        // Testa getter básico
        const reservasString = sorteioConfig.reservasEspeciais;
        console.log('📝 String de reservas:', reservasString);

        // Testa parsing de reservas
        const reservas = sorteioConfig.getReservasEspeciais();
        console.log('🗺️ Mapa de reservas:', reservas);

        // Testa verificação por apartamento
        const vaga301 = sorteioConfig.getVagaReservada('301');
        const vaga402 = sorteioConfig.getVagaReservada('402');
        const vaga999 = sorteioConfig.getVagaReservada('999');

        console.log('🏠 Apartamento 301 → Vaga:', vaga301);
        console.log('🏠 Apartamento 402 → Vaga:', vaga402);
        console.log('🏠 Apartamento 999 → Vaga:', vaga999);

        // Testa lista de vagas reservadas
        const vagasReservadas = sorteioConfig.getVagasReservadas();
        console.log('🔒 Vagas reservadas:', vagasReservadas);

        // Testa proteção de pares
        const vagasBloqueadas = sorteioConfig.getVagasBloqueadasParaDuplas();
        console.log('🚫 Vagas bloqueadas para duplas:', vagasBloqueadas);

        console.log('✅ TODOS OS TESTES PASSARAM!');

    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
    }
}

// Executa teste se for chamado diretamente
if (process.argv[1].endsWith('test-reservas.js')) {
    testeReservasEspeciais();
}

export { testeReservasEspeciais };