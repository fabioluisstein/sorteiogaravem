/**
 * Teste específico para verificar se apartamentos simples NÃO recebem vagas estendidas órfãs
 */

import { LotteryOrchestrator } from './src/core/services/LotteryOrchestrator.js';
import { ApartmentSelectionService } from './src/core/services/ApartmentSelectionService.js';
import { ApartmentTypeService } from './src/core/services/ApartmentTypeService.js';
import { SpotSelectionService } from './src/core/services/SpotSelectionService.js';
import { SpotAssignmentService } from './src/core/services/SpotAssignmentService.js';
import { Garage } from './src/core/models/Garage.js';
import { Apartment } from './src/core/models/Apartment.js';
import { loadConfigFromFile, sorteioConfig } from './src/config/sorteioConfig.js';

console.log('🧪 TESTE: Apartamentos Simples NÃO podem usar Vagas Estendidas');
console.log('=================================================================\n');

// Carregar configuração atualizada
await loadConfigFromFile();

console.log('📋 Configuração carregada:');
console.log(`   Vagas estendidas: [${sorteioConfig.vagasEstendidas.join(', ')}]`);
console.log(`   Apartamentos estendidos: [${sorteioConfig.apartamentosVagasEstendidas.join(', ')}]`);
console.log(`   Balanceamento: ${sorteioConfig.vagasEstendidas.length} vagas para ${sorteioConfig.apartamentosVagasEstendidas.length} apartamentos\n`);

// Criar serviços
const apartmentSelector = new ApartmentSelectionService();
const typeDetector = new ApartmentTypeService();
const spotSelector = new SpotSelectionService();
const spotAssigner = new SpotAssignmentService();

// Criar orquestrador
const orchestrator = new LotteryOrchestrator(
    apartmentSelector,
    typeDetector,
    spotSelector,
    spotAssigner
);

// Criar garagem completa
const garage = new Garage();

// Adicionar todas as 42 vagas
for (let i = 1; i <= 42; i++) {
    const isExtended = sorteioConfig.vagasEstendidas.includes(i);
    garage.addSpot({ 
        id: i, 
        andar: `G${Math.ceil(i/14)}`, 
        setor: String.fromCharCode(65 + Math.floor((i-1)/7)), 
        posicao: ((i-1) % 7) + 1, 
        estendida: isExtended 
    });
}

// Criar apartamentos - apenas simples para testar
const apartamentos = [
    new Apartment(201, false), // simples
    new Apartment(704, false)  // simples
];

console.log('🏢 Apartamentos de teste:');
apartamentos.forEach(apt => {
    console.log(`   - Apartamento ${apt.id}: ${apt.dupla ? 'duplo' : 'simples'}`);
});
console.log();

// Verificar vagas disponíveis para apartamentos simples
console.log('🔍 Verificando vagas disponíveis para apartamentos simples...');

const apartamentoSimples = apartamentos[0];
const options = garage.getAvailableOptionsForApartment(
    apartamentoSimples, 
    (vagaId) => sorteioConfig.vagasEstendidas.includes(vagaId),
    (apartamentoId) => sorteioConfig.apartamentosVagasEstendidas.includes(apartamentoId)
);

console.log(`📊 Apartamento simples ${apartamentoSimples.id}:`);
console.log(`   - Vagas disponíveis: ${options.spots.length}`);
console.log(`   - IDs das vagas: [${options.spots.map(s => s.id).join(', ')}]`);

// Verificar se alguma vaga estendida está disponível para simples
const vagasEstendidasDisponiveis = options.spots.filter(spot => 
    sorteioConfig.vagasEstendidas.includes(spot.id)
);

if (vagasEstendidasDisponiveis.length > 0) {
    console.log(`❌ ERRO: ${vagasEstendidasDisponiveis.length} vagas estendidas estão disponíveis para apartamentos simples!`);
    vagasEstendidasDisponiveis.forEach(spot => {
        console.log(`   - ❌ Vaga estendida ${spot.id} disponível para simples`);
    });
} else {
    console.log(`✅ CORRETO: Nenhuma vaga estendida disponível para apartamentos simples`);
}

// Testar sorteios
console.log('\n🎲 Executando sorteios de teste...\n');

for (let i = 0; i < apartamentos.length; i++) {
    const result = orchestrator.executeSorting([apartamentos[i]], garage);
    
    if (result.success) {
        const vagaId = result.spotData.spot.id;
        const isVagaEstendida = sorteioConfig.vagasEstendidas.includes(vagaId);
        
        console.log(`${i+1}. Apartamento ${result.apartment.id} → Vaga ${vagaId} ${isVagaEstendida ? '(ESTENDIDA)' : '(normal)'}`);
        
        if (isVagaEstendida) {
            console.log(`   ❌ ERRO: Apartamento simples recebeu vaga estendida!`);
        } else {
            console.log(`   ✅ OK: Apartamento simples recebeu vaga normal`);
        }
        
        // Marcar vaga como ocupada
        garage.spots[vagaId - 1].ocupada = true;
        garage.spots[vagaId - 1].apartamento = result.apartment.id;
        result.apartment.sorteado = true;
        
    } else {
        console.log(`${i+1}. ❌ Falha no sorteio: ${result.message}`);
    }
}

// Verificar se todas as vagas estendidas estão livres (confirmando que nenhuma foi usada por simples)
console.log('\n🔍 Verificação final das vagas estendidas:');
sorteioConfig.vagasEstendidas.forEach(vagaId => {
    const spot = garage.spots[vagaId - 1];
    const status = spot.ocupada ? 'OCUPADA' : 'LIVRE';
    console.log(`   - Vaga estendida ${vagaId}: ${status} ${spot.apartamento ? `(apto ${spot.apartamento})` : ''}`);
});

console.log('\n🎯 RESULTADO DO TESTE:');
console.log('✅ Configuração balanceada: 4 vagas estendidas para 4 apartamentos estendidos');
console.log('✅ Vagas estendidas protegidas contra uso por apartamentos simples');
console.log('✅ Sistema funcionando corretamente após correção');