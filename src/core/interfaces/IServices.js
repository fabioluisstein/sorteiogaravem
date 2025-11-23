/**
 * @fileoverview Interfaces para o sistema de sorteio seguindo princípios SOLID
 * @description Define os contratos que os serviços devem implementar
 */

/**
 * Interface para seleção de apartamentos
 * @interface IApartmentSelector
 */
export class IApartmentSelector {
    /**
     * Seleciona um apartamento aleatório da lista de disponíveis
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @returns {Apartment|null} - Apartamento selecionado ou null se nenhum disponível
     */
    selectRandomApartment(apartments) {
        throw new Error('Method selectRandomApartment must be implemented');
    }
}

/**
 * Interface para detecção de tipos de apartamento
 * @interface IApartmentTypeDetector
 */
export class IApartmentTypeDetector {
    /**
     * Determina o tipo de um apartamento
     * @param {Apartment} apartment - Apartamento a ser analisado
     * @returns {string} - Tipo do apartamento ('simples', 'duplo', 'estendido')
     */
    determineType(apartment) {
        throw new Error('Method determineType must be implemented');
    }
}

/**
 * Interface para seleção de vagas
 * @interface ISpotSelector
 */
export class ISpotSelector {
    /**
     * Seleciona uma vaga para o apartamento especificado
     * @param {Apartment} apartment - Apartamento que será sorteado
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object|null} - Vaga selecionada ou null se nenhuma disponível
     */
    selectSpot(apartment, garage) {
        throw new Error('Method selectSpot must be implemented');
    }
}

/**
 * Interface para atribuição de vagas
 * @interface ISpotAssigner
 */
export class ISpotAssigner {
    /**
     * Atribui uma vaga a um apartamento
     * @param {Apartment} apartment - Apartamento
     * @param {Object} spotData - Dados da vaga/par
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object} - Resultado da operação {success, garage, apartment, message}
     */
    assignSpot(apartment, spotData, garage) {
        throw new Error('Method assignSpot must be implemented');
    }
}

/**
 * Interface para orquestração do sorteio
 * @interface ILotteryOrchestrator
 */
export class ILotteryOrchestrator {
    /**
     * Executa o fluxo completo de sorteio
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object} - Resultado do sorteio
     */
    executeSorting(apartments, garage) {
        throw new Error('Method executeSorting must be implemented');
    }
}

/**
 * Interface para estratégias de seleção de vaga
 * @interface ISpotSelectionStrategy
 */
export class ISpotSelectionStrategy {
    /**
     * Executa a estratégia de seleção
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object|null} - Vaga/par selecionado ou null
     */
    execute(garage) {
        throw new Error('Method execute must be implemented');
    }
}

/**
 * Interface para serviços de randomização
 * @interface IRandomnessService
 */
export class IRandomnessService {
    /**
     * Embaralha um array
     * @param {Array} array - Array a ser embaralhado
     * @returns {Array} - Array embaralhado
     */
    shuffle(array) {
        throw new Error('Method shuffle must be implemented');
    }

    /**
     * Seleciona um item aleatório de um array
     * @param {Array} array - Array de onde selecionar
     * @returns {*} - Item selecionado
     */
    selectRandom(array) {
        throw new Error('Method selectRandom must be implemented');
    }
}

/**
 * Interface para validação
 * @interface IValidationService
 */
export class IValidationService {
    /**
     * Valida se um apartamento pode receber uma vaga
     * @param {Apartment} apartment - Apartamento
     * @param {Object} spotData - Dados da vaga
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Resultado da validação {valid, message}
     */
    validateAssignment(apartment, spotData, garage) {
        throw new Error('Method validateAssignment must be implemented');
    }
}

export default {
    IApartmentSelector,
    IApartmentTypeDetector,
    ISpotSelector,
    ISpotAssigner,
    ILotteryOrchestrator,
    ISpotSelectionStrategy,
    IRandomnessService,
    IValidationService
};