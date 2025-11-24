/**
 * Teste para reproduzir e corrigir o erro "Cannot read properties of null (reading 'type')"
 */

import { LotteryOrchestrator } from './src/core/services/LotteryOrchestrator.js';
import { ApartmentSelectionService } from './src/core/services/ApartmentSelectionService.js';
import { ApartmentTypeService } from './src/core/services/ApartmentTypeService.js';
import { SpotSelectionService } from './src/core/services/SpotSelectionService.js';
import { SpotAssignmentService } from './src/core/services/SpotAssignmentService.js';
import { Garage } from './src/core/models/Garage.js';
import { Apartment } from './src/core/models/Apartment.js';
import { loadConfigFromFile } from './src/config/sorteioConfig.js';

console.log('🧪 TESTE: Reproduzir erro "Cannot read properties of null (reading \'type\')"');
console.log('==================================================================\n');

// Carregar configuração
await loadConfigFromFile();

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

// Criar uma situação onde só resta 1 apartamento
const garage = new Garage();
for (let i = 1; i <= 5; i++) {
    garage.addSpot({ id: i, andar: 'G1', setor: 'A', posicao: i, estendida: false });
}

const apartments = [new Apartment(101, false)]; // Só 1 apartamento simples

console.log('📋 Setup do teste:');
console.log(`- ${garage.spots.length} vagas criadas`);
console.log(`- ${apartments.length} apartamento criado`);
console.log('- Cenário: último apartamento do sorteio\n');

console.log('🎯 Executando primeiro sorteio (sucesso esperado)...');
const result1 = orchestrator.executeSorting(apartments, garage);

if (result1.success && !result1.allApartmentsSorted) {
    console.log(`✅ Apartamento ${result1.apartment.id} → Vaga ${result1.spotData.spot.id}`);

    // Marcar como sorteado
    result1.apartment.sorteado = true;

    console.log('🎯 Executando segundo sorteio (finalização esperada)...');
    const result2 = orchestrator.executeSorting(apartments, garage);

    if (result2.success && result2.allApartmentsSorted) {
        console.log('✅ TESTE PASSOU: Finalização detectada corretamente');
        console.log(`📝 Mensagem: ${result2.message}`);
        console.log(`🎉 allApartmentsSorted: ${result2.allApartmentsSorted}`);
        console.log(`📊 spotData: ${result2.spotData}`);
        console.log(`📊 assignmentResult: ${result2.assignmentResult}`);

        // Simular o que o React faria
        console.log('\n🔍 Simulando código React...');
        if (result2.allApartmentsSorted) {
            console.log('✅ React: Finalização detectada, não tentando acessar result.spotData.type');
        } else {
            // Este código causaria o erro se não fosse tratado
            try {
                const spotIds = result2.spotData.type === 'double' ? 'pares' : 'simples';
                console.log(`❌ ERRO: Este código não deveria ser executado: ${spotIds}`);
            } catch (error) {
                console.log(`❌ ERRO capturado: ${error.message}`);
            }
        }

    } else {
        console.log('❌ TESTE FALHOU: Finalização não detectada');
        console.log(`📝 success: ${result2.success}`);
        console.log(`📝 message: ${result2.message}`);
    }

} else {
    console.log('❌ TESTE FALHOU: Primeiro sorteio não funcionou');
    console.log(`📝 success: ${result1.success}`);
    console.log(`📝 message: ${result1.message}`);
}

console.log('\n🎯 CONCLUSÃO: O erro era causado porque result.spotData é null quando');
console.log('todos os apartamentos foram sorteados, mas o React tentava acessar');
console.log('result.spotData.type. A correção foi adicionar verificação para');
console.log('result.allApartmentsSorted antes de tentar acessar spotData.');