/**
 * @fileoverview Estratégias de Seleção de Vagas
 * @description Implementa padrão Strategy para diferentes tipos de seleção de vagas
 */

import { ISpotSelectionStrategy } from '../interfaces/IServices.js';

/**
 * Estratégia para seleção de vagas simples
 * @class SimpleSpotSelectionStrategy
 * @implements {ISpotSelectionStrategy}
 */
export class SimpleSpotSelectionStrategy extends ISpotSelectionStrategy {
    /**
     * @param {IRandomnessService} randomnessService - Serviço de aleatorização
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     * @param {Function} isExtendedApartmentFn - Função para verificar se apartamento é estendido
     */
    constructor(randomnessService, isExtendedSpotFn, isExtendedApartmentFn) {
        super();
        this.randomnessService = randomnessService;
        this.isExtendedSpotFn = isExtendedSpotFn;
        this.isExtendedApartmentFn = isExtendedApartmentFn;
    }

    /**
     * Executa a seleção de vaga simples usando método unificado
     * @param {Garage} garage - Estado atual da garagem
     * @param {Apartment} apartment - Apartamento a ser sorteado
     * @returns {Object|null} - {type: 'simple', spot: Spot} ou null
     */
    execute(garage, apartment) {
        // Usar método unificado para obter vagas disponíveis
        const availableOptions = garage.getAvailableOptionsForApartment(apartment, this.isExtendedSpotFn, this.isExtendedApartmentFn);

        if (availableOptions.type !== 'simple' || availableOptions.spots.length === 0) {
            console.log(`🚫 Não há vagas simples disponíveis para apartamento ${apartment.id}`);
            return null;
        }

        // Selecionar vaga aleatória
        const selectedSpot = this.randomnessService.selectRandom(availableOptions.spots);

        console.log(`🎲 Vaga simples ${selectedSpot.id} sorteada aleatoriamente para apartamento ${apartment.id} (${availableOptions.spots.length} disponíveis)`);

        return {
            type: 'simple',
            spot: selectedSpot
        };
    }
}

/**
 * Estratégia para seleção de pares de vagas duplas
 * @class DoubleSpotSelectionStrategy
 * @implements {ISpotSelectionStrategy}
 */
export class DoubleSpotSelectionStrategy extends ISpotSelectionStrategy {
    /**
     * @param {IRandomnessService} randomnessService - Serviço de aleatorização
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     * @param {Function} isExtendedApartmentFn - Função para verificar se apartamento é estendido
     */
    constructor(randomnessService, isExtendedSpotFn, isExtendedApartmentFn) {
        super();
        this.randomnessService = randomnessService;
        this.isExtendedSpotFn = isExtendedSpotFn;
        this.isExtendedApartmentFn = isExtendedApartmentFn;
    }

    /**
     * Executa a seleção de par duplo usando método unificado
     * @param {Garage} garage - Estado atual da garagem
     * @param {Apartment} apartment - Apartamento a ser sorteado
     * @returns {Object|null} - {type: 'double', pair: Object} ou null
     */
    execute(garage, apartment) {
        // Usar método unificado para obter pares disponíveis
        const availableOptions = garage.getAvailableOptionsForApartment(apartment, this.isExtendedSpotFn, this.isExtendedApartmentFn);

        if (availableOptions.type !== 'double' || availableOptions.pairs.length === 0) {
            console.log(`🚫 Não há pares duplos disponíveis para apartamento ${apartment.id}`);
            return null;
        }

        // Selecionar par aleatório
        const selectedPair = this.randomnessService.selectRandom(availableOptions.pairs);

        // Liberar a pré-reserva do par selecionado
        garage.releaseDoublePairReservation(selectedPair.id);

        console.log(`🎲 Par duplo ${selectedPair.id} sorteado aleatoriamente para apartamento ${apartment.id} (vagas ${selectedPair.aId}, ${selectedPair.bId}) - ${availableOptions.pairs.length} pares disponíveis`);

        return {
            type: 'double',
            pair: selectedPair
        };
    }
}

/**
 * Estratégia para seleção de vagas estendidas
 * @class ExtendedSpotSelectionStrategy
 * @implements {ISpotSelectionStrategy}
 */
export class ExtendedSpotSelectionStrategy extends ISpotSelectionStrategy {
    /**
     * @param {IRandomnessService} randomnessService - Serviço de aleatorização
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     * @param {Function} isExtendedApartmentFn - Função para verificar se apartamento é estendido
     */
    constructor(randomnessService, isExtendedSpotFn, isExtendedApartmentFn) {
        super();
        this.randomnessService = randomnessService;
        this.isExtendedSpotFn = isExtendedSpotFn;
        this.isExtendedApartmentFn = isExtendedApartmentFn;
    }

    /**
     * Executa a seleção de vaga estendida usando método unificado
     * @param {Garage} garage - Estado atual da garagem
     * @param {Apartment} apartment - Apartamento a ser sorteado
     * @returns {Object|null} - {type: 'extended', spot: Spot} ou null
     */
    execute(garage, apartment) {
        // Usar método unificado para obter vagas disponíveis
        const availableOptions = garage.getAvailableOptionsForApartment(apartment, this.isExtendedSpotFn, this.isExtendedApartmentFn);

        if (availableOptions.type !== 'extended' || availableOptions.spots.length === 0) {
            console.log(`🚫 Não há vagas estendidas disponíveis para apartamento ${apartment.id}`);
            return null;
        }

        // Selecionar vaga estendida aleatória
        const selectedSpot = this.randomnessService.selectRandom(availableOptions.spots);

        console.log(`🎲 Vaga estendida ${selectedSpot.id} sorteada aleatoriamente para apartamento ${apartment.id} (${availableOptions.spots.length} disponíveis)`);

        return {
            type: 'extended',
            spot: selectedSpot
        };
    }
}