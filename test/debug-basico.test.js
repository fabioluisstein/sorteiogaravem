import { describe, it, expect } from 'vitest';
import { LotteryService } from '../src/services/LotteryService.js';
import { garageData } from '../src/config/sorteioConfig.js';

describe('🔍 DEBUG BÁSICO', () => {
    it('deve testar uma única atribuição', () => {
        // Apartamento simples
        const apartamento = {
            id: 101,
            apartmentNumber: '101',
            type: 'simple'
        };

        console.log('🏢 Apartamento:', apartamento);

        // Verificar garagem
        console.log('🏗️ Total de vagas:', garageData.spots.length);
        console.log('🆓 Vagas livres iniciais:', garageData.spots.filter(s => !s.occupiedBy).length);

        // Testar atribuição
        const lotteryService = new LotteryService();
        const resultado = lotteryService.drawOneWithRetry([apartamento], garageData);

        console.log('📋 Resultado completo:', resultado);
        console.log('✅ Sucesso?', resultado.success);
        console.log('❌ Erro:', resultado.error);
        console.log('🎯 Detalhes:', resultado.assignmentResult);

        // Verificação simples
        expect(resultado).toBeDefined();
    });
});