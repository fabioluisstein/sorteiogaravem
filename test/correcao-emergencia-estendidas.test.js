/**
 * 🧪 TESTE - Correção do Modo Emergência para Vagas Estendidas
 * Este teste verifica se apenas apartamentos AUTORIZADOS podem receber
 * vagas estendidas, mesmo durante o modo emergência
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SingleSpotAssignmentStrategy } from '../src/services/SingleSpotAssignmentStrategy.js';
import { ValidationService } from '../src/services/ValidationService.js';
import { SpotSelectionService } from '../src/services/SpotSelectionService.js';
import { RandomnessService } from '../src/services/RandomnessService.js';
import { sorteioConfig } from '../src/config/sorteioConfig.js';

describe('🔒 Correção do Modo Emergência - Vagas Estendidas', () => {
    let strategy;
    let randomService;

    beforeEach(async () => {
        // Carregar configuração padrão
        await sorteioConfig.loadFromFile(`
vagas_estendidas=7,8,21,22,35,36
apartamentos_vagas_estendidas=303,403,503,603,703
        `);

        randomService = new RandomnessService(12345);
        strategy = new SingleSpotAssignmentStrategy(randomService);
    });

    it('deve PERMITIR apartamento autorizado usar vaga estendida em emergência', () => {
        // Cenário: Só sobram vagas estendidas e apartamento tem autorização
        const garagem = {
            floors: {
                G1: {
                    A: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: 'available' },
                    B: { 8: 'available', 9: null, 10: null, 11: null, 12: null, 13: null, 14: null }
                },
                G2: { C: {}, D: {} },
                G3: { E: {}, F: {} }
            }
        };

        const apartamento303 = { id: 303, type: 'simples' }; // Autorizado para estendidas

        const resultado = strategy.execute(apartamento303, garagem);

        expect(resultado.success).toBe(true);
        expect(resultado.spotType).toBe('extended-emergency');
        expect([7, 8]).toContain(resultado.vagaNumero); // Deveria receber vaga 7 ou 8

        console.log('✅ Apartamento 303 (autorizado) conseguiu vaga estendida em emergência:', resultado.vagaNumero);
    });

    it('deve NEGAR apartamento NÃO autorizado usar vaga estendida em emergência', () => {
        // Cenário: Só sobram vagas estendidas mas apartamento NÃO tem autorização
        const garagem = {
            floors: {
                G1: {
                    A: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: 'available' },
                    B: { 8: 'available', 9: null, 10: null, 11: null, 12: null, 13: null, 14: null }
                },
                G2: { C: {}, D: {} },
                G3: { E: {}, F: {} }
            }
        };

        const apartamento201 = { id: 201, type: 'simples' }; // NÃO autorizado para estendidas

        const resultado = strategy.execute(apartamento201, garagem);

        expect(resultado.success).toBe(false);
        expect(resultado.shouldRetry).toBe(true);
        expect(resultado.error).toContain('não autorizado');

        console.log('❌ Apartamento 201 (NÃO autorizado) foi NEGADO corretamente:', resultado.error);
    });

    it('deve mostrar diferentes logs para emergência autorizada vs negada', () => {
        const garagem = {
            floors: {
                G1: {
                    A: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: 'available' },
                    B: { 8: 'available', 9: null, 10: null, 11: null, 12: null, 13: null, 14: null }
                },
                G2: { C: {}, D: {} },
                G3: { E: {}, F: {} }
            }
        };

        console.log('\n🧪 TESTANDO LOGS DE EMERGÊNCIA...');

        // Apartamento autorizado
        const apartamento403 = { id: 403, type: 'simples' };
        console.log('\n📋 Teste com apartamento AUTORIZADO (403):');
        const resultadoAutorizado = strategy.execute(apartamento403, garagem);

        // Apartamento não autorizado
        const apartamento704 = { id: 704, type: 'simples' };
        console.log('\n📋 Teste com apartamento NÃO AUTORIZADO (704):');
        const resultadoNaoAutorizado = strategy.execute(apartamento704, garagem);

        // Verificações
        expect(resultadoAutorizado.success).toBe(true);
        expect(resultadoNaoAutorizado.success).toBe(false);

        console.log('\n🎯 RESUMO DOS RESULTADOS:');
        console.log('  Autorizado (403):', resultadoAutorizado.success ? 'SUCESSO' : 'FALHA');
        console.log('  Não autorizado (704):', resultadoNaoAutorizado.success ? 'SUCESSO' : 'FALHA');
    });

    it('deve verificar lista de apartamentos autorizados', () => {
        console.log('\n📊 APARTAMENTOS AUTORIZADOS PARA VAGAS ESTENDIDAS:');

        const apartamentosParaTestar = [101, 201, 303, 403, 503, 603, 703, 704];

        apartamentosParaTestar.forEach(apt => {
            const autorizado = sorteioConfig.apartamentoPodeVagaEstendida(apt);
            console.log(`   Apartamento ${apt}: ${autorizado ? '✅ AUTORIZADO' : '❌ NÃO autorizado'}`);
        });

        // Verificar se a lista está correta
        const autorizados = [303, 403, 503, 603, 703];
        const naoAutorizados = [101, 201, 704];

        autorizados.forEach(apt => {
            expect(sorteioConfig.apartamentoPodeVagaEstendida(apt)).toBe(true);
        });

        naoAutorizados.forEach(apt => {
            expect(sorteioConfig.apartamentoPodeVagaEstendida(apt)).toBe(false);
        });
    });
});