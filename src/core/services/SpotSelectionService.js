/**
 * @fileoverview TASK 3 - Serviço de Seleção de Vagas
 * @description Coordena as estratégias de seleção baseado no tipo de apartamento
 */

import { ISpotSelector } from '../interfaces/IServices.js';
import { ApartmentType } from '../models/Apartment.js';
import {
    SimpleSpotSelectionStrategy,
    DoubleSpotSelectionStrategy,
    ExtendedSpotSelectionStrategy
} from '../strategies/SpotSelectionStrategies.js';

/**
 * Serviço de seleção de vagas usando padrão Strategy
 * Implementa Open/Closed Principle - extensível sem modificação
 * 
 * TASK 3 CRITÉRIOS:
 * - Sortear vaga SIMPLES para apartamento simples (exclui estendidas)
 * - Sortear PAR DUPLO para apartamento duplo (exclui pares com estendidas)
 * - Sortear vaga ESTENDIDA para apartamento estendido
 * - Retornar null se não há vagas do tipo disponível
 * 
 * @class SpotSelectionService
 * @implements {ISpotSelector}
 */
export class SpotSelectionService extends ISpotSelector {
    /**
     * @param {IRandomnessService} randomnessService - Serviço de aleatorização
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     */
    constructor(randomnessService, isExtendedSpotFn) {
        super();
        this.randomnessService = randomnessService;
        this.isExtendedSpotFn = isExtendedSpotFn;

        // Inicializar estratégias
        this.strategies = {
            [ApartmentType.SIMPLES]: new SimpleSpotSelectionStrategy(randomnessService, isExtendedSpotFn),
            [ApartmentType.DUPLO]: new DoubleSpotSelectionStrategy(randomnessService, isExtendedSpotFn),
            [ApartmentType.ESTENDIDO]: new ExtendedSpotSelectionStrategy(randomnessService, isExtendedSpotFn)
        };
    }

    /**
     * Seleciona uma vaga baseada no tipo do apartamento
     * @param {string} apartmentType - Tipo do apartamento (simples, duplo, estendido)
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object|null} - Dados da vaga/par selecionado ou null
     */
    selectSpot(apartmentType, garage) {
        // Validação de entrada
        if (!apartmentType || !garage) {
            throw new Error('Tipo de apartamento e garagem são obrigatórios');
        }

        // Verificar se tipo é válido
        if (!Object.values(ApartmentType).includes(apartmentType)) {
            throw new Error(`Tipo de apartamento inválido: ${apartmentType}`);
        }

        // Obter estratégia apropriada
        const strategy = this.strategies[apartmentType];
        if (!strategy) {
            throw new Error(`Estratégia não encontrada para tipo: ${apartmentType}`);
        }

        // Executar estratégia
        try {
            return strategy.execute(garage);
        } catch (error) {
            console.error(`Erro ao executar estratégia para ${apartmentType}:`, error.message);
            return null;
        }
    }

    /**
     * Adiciona ou substitui uma estratégia para um tipo específico
     * @param {string} apartmentType - Tipo do apartamento
     * @param {ISpotSelectionStrategy} strategy - Nova estratégia
     */
    setStrategy(apartmentType, strategy) {
        this.strategies[apartmentType] = strategy;
    }

    /**
     * Verifica se há vagas disponíveis para um tipo de apartamento
     * @param {string} apartmentType - Tipo do apartamento
     * @param {Garage} garage - Estado da garagem
     * @returns {boolean}
     */
    hasAvailableSpots(apartmentType, garage) {
        try {
            const result = this.selectSpot(apartmentType, garage);
            return result !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Retorna estatísticas de vagas disponíveis por tipo
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Contadores de vagas disponíveis por tipo
     */
    getAvailabilityStatistics(garage) {
        const stats = {
            [ApartmentType.SIMPLES]: 0,
            [ApartmentType.DUPLO]: 0,
            [ApartmentType.ESTENDIDO]: 0
        };

        try {
            // Vagas simples (normais livres)
            stats[ApartmentType.SIMPLES] = garage.getFreeNormalSpots(this.isExtendedSpotFn).length;

            // Pares duplos (pares livres sem vagas estendidas)
            stats[ApartmentType.DUPLO] = garage.getFilteredFreePairs(pair => {
                const aIsExtended = this.isExtendedSpotFn && this.isExtendedSpotFn(pair.aId);
                const bIsExtended = this.isExtendedSpotFn && this.isExtendedSpotFn(pair.bId);
                return !aIsExtended && !bIsExtended;
            }).length;

            // Vagas estendidas
            stats[ApartmentType.ESTENDIDO] = garage.getFreeExtendedSpots(this.isExtendedSpotFn).length;
        } catch (error) {
            console.error('Erro ao calcular estatísticas de disponibilidade:', error.message);
        }

        return stats;
    }

    /**
     * Atualiza a função de verificação de vagas estendidas
     * @param {Function} isExtendedSpotFn - Nova função de verificação
     */
    updateExtendedSpotFunction(isExtendedSpotFn) {
        this.isExtendedSpotFn = isExtendedSpotFn;

        // Atualizar todas as estratégias
        Object.values(this.strategies).forEach(strategy => {
            if (strategy.isExtendedSpotFn !== undefined) {
                strategy.isExtendedSpotFn = isExtendedSpotFn;
            }
        });
    }
}

export default SpotSelectionService;