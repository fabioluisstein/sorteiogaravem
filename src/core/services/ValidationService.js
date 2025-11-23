/**
 * @fileoverview Serviço de Validação para o Sistema de Sorteio
 * @description Centraliza todas as validações do sistema seguindo SRP
 */

import { IValidationService } from '../interfaces/IServices.js';
import { SpotType } from '../models/Spot.js';

/**
 * Serviço de validação para operações do sistema
 * Implementa Single Responsibility - apenas validações
 * 
 * @class ValidationService
 * @implements {IValidationService}
 */
export class ValidationService extends IValidationService {
    /**
     * Valida se um apartamento pode receber uma vaga
     * @param {Apartment} apartment - Apartamento
     * @param {Object} spotData - Dados da vaga/par
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - {valid: boolean, message: string}
     */
    validateAssignment(apartment, spotData, garage) {
        // Validação de entrada: apartamento
        if (!apartment || typeof apartment.id === 'undefined') {
            return {
                valid: false,
                message: 'Apartamento é obrigatório'
            };
        }

        // Validação de entrada: spotData
        if (!spotData) {
            return {
                valid: false,
                message: 'Dados da vaga são obrigatórios'
            };
        }

        // Validação de entrada: garage
        if (!garage) {
            return {
                valid: false,
                message: 'Garagem é obrigatória'
            };
        }

        // Validar tipo de vaga (simples vs par)
        if (spotData.type === 'simple') {
            return this._validateSingleSpotAssignment(apartment, spotData.spot, garage);
        } else if (spotData.type === 'double') {
            return this._validateDoubleSpotAssignment(apartment, spotData.pair, garage);
        } else if (spotData.type === 'extended') {
            return this._validateExtendedSpotAssignment(apartment, spotData.spot, garage);
        }

        return {
            valid: false,
            message: `Tipo de vaga inválido: ${spotData.type}`
        };
    }

    /**
     * Valida atribuição de vaga simples
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Spot} spot - Vaga
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da validação
     */
    _validateSingleSpotAssignment(apartment, spot, garage) {
        if (!spot || typeof spot.id === 'undefined') {
            return {
                valid: false,
                message: 'Dados da vaga são inválidos'
            };
        }

        // Encontrar vaga na garagem
        const garageSpot = garage.findSpot(spot.id);
        if (!garageSpot) {
            return {
                valid: false,
                message: `Vaga ${spot.id} não encontrada na garagem`
            };
        }

        // Verificar se vaga está livre
        if (!garageSpot.isFree()) {
            if (garageSpot.isBlocked()) {
                return {
                    valid: false,
                    message: `Vaga ${spot.id} está bloqueada`
                };
            }
            if (garageSpot.isOccupied()) {
                return {
                    valid: false,
                    message: `Vaga ${spot.id} já está ocupada`
                };
            }
            return {
                valid: false,
                message: `Vaga ${spot.id} não está disponível`
            };
        }

        // Verificar tipo da vaga
        if (garageSpot.type !== SpotType.VAGA) {
            return {
                valid: false,
                message: `Vaga ${spot.id} não é do tipo VAGA (${garageSpot.type})`
            };
        }

        return {
            valid: true,
            message: `Vaga ${spot.id} válida para atribuição`
        };
    }

    /**
     * Valida atribuição de par duplo
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Object} pair - Par de vagas
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da validação
     */
    _validateDoubleSpotAssignment(apartment, pair, garage) {
        if (!pair || !pair.id || typeof pair.aId === 'undefined' || typeof pair.bId === 'undefined') {
            return {
                valid: false,
                message: 'Dados do par são inválidos'
            };
        }

        // Encontrar par na garagem
        const garagePair = garage.findPair(pair.id);
        if (!garagePair) {
            return {
                valid: false,
                message: `Par ${pair.id} não encontrado na garagem`
            };
        }

        // Verificar se par está reservado
        if (garagePair.reservedFor && garagePair.reservedFor !== apartment.id) {
            return {
                valid: false,
                message: `Par ${pair.id} já está reservado para outro apartamento`
            };
        }

        // Validar ambas as vagas do par
        const spotAValidation = this._validateSingleSpotByID(pair.aId, garage);
        if (!spotAValidation.valid) {
            return {
                valid: false,
                message: `Vaga A do par ${pair.id}: ${spotAValidation.message}`
            };
        }

        const spotBValidation = this._validateSingleSpotByID(pair.bId, garage);
        if (!spotBValidation.valid) {
            return {
                valid: false,
                message: `Vaga B do par ${pair.id}: ${spotBValidation.message}`
            };
        }

        return {
            valid: true,
            message: `Par ${pair.id} válido para atribuição`
        };
    }

    /**
     * Valida atribuição de vaga estendida
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Spot} spot - Vaga estendida
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da validação
     */
    _validateExtendedSpotAssignment(apartment, spot, garage) {
        // Usar mesma validação de vaga simples
        return this._validateSingleSpotAssignment(apartment, spot, garage);
    }

    /**
     * Valida vaga por ID
     * @private
     * @param {number|string} spotId - ID da vaga
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da validação
     */
    _validateSingleSpotByID(spotId, garage) {
        const spot = garage.findSpot(spotId);
        if (!spot) {
            return {
                valid: false,
                message: `Vaga ${spotId} não encontrada na garagem`
            };
        }

        if (!spot.isFree()) {
            return {
                valid: false,
                message: `Vaga ${spotId} não está livre`
            };
        }

        if (spot.type !== SpotType.VAGA) {
            return {
                valid: false,
                message: `Vaga ${spotId} não é do tipo VAGA`
            };
        }

        return {
            valid: true,
            message: `Vaga ${spotId} é válida`
        };
    }

    /**
     * Valida se apartamento pode ser sorteado
     * @param {Apartment} apartment - Apartamento a validar
     * @returns {Object} - Resultado da validação
     */
    validateApartmentForDraw(apartment) {
        if (!apartment) {
            return {
                valid: false,
                message: 'Apartamento é obrigatório'
            };
        }

        if (!apartment.isAvailableForDraw()) {
            if (!apartment.ativo) {
                return {
                    valid: false,
                    message: 'Apartamento está inativo'
                };
            }
            if (apartment.sorteado) {
                return {
                    valid: false,
                    message: 'Apartamento já foi sorteado'
                };
            }
            return {
                valid: false,
                message: 'Apartamento não disponível para sorteio'
            };
        }

        return {
            valid: true,
            message: 'Apartamento válido para sorteio'
        };
    }

    /**
     * Valida estado geral da garagem
     * @param {Garage} garage - Garagem a validar
     * @returns {Object} - Resultado da validação
     */
    validateGarage(garage) {
        if (!garage) {
            return {
                valid: false,
                message: 'Garagem é obrigatória'
            };
        }

        if (!garage.spots || !Array.isArray(garage.spots)) {
            return {
                valid: false,
                message: 'Garagem deve ter array de vagas'
            };
        }

        if (!garage.pairs || typeof garage.pairs !== 'object') {
            return {
                valid: false,
                message: 'Garagem deve ter objeto de pares'
            };
        }

        return {
            valid: true,
            message: 'Garagem válida'
        };
    }
}

export default ValidationService;