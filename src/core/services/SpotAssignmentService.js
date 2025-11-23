/**
 * @fileoverview TASK 4 - Serviço de Atribuição de Vagas
 * @description Atribui vagas aos apartamentos com todas as validações necessárias
 */

import { ISpotAssigner } from '../interfaces/IServices.js';

/**
 * Serviço de atribuição de vagas
 * Implementa Single Responsibility - apenas atribuição de vagas
 * 
 * TASK 4 CRITÉRIOS:
 * - Atribuir vaga SIMPLES a apartamento (ocupar vaga na garagem)
 * - Atribuir PAR DUPLO a apartamento (ocupar ambas vagas do par)
 * - Atribuir vaga ESTENDIDA a apartamento (ocupar vaga estendida)
 * - Remover vaga anterior se apartamento já tem vaga
 * - Validar todas as operações antes de executar
 * - Manter imutabilidade dos objetos originais
 * 
 * @class SpotAssignmentService
 * @implements {ISpotAssigner}
 */
export class SpotAssignmentService extends ISpotAssigner {
    /**
     * @param {IValidationService} validationService - Serviço de validação
     */
    constructor(validationService) {
        super();
        this.validationService = validationService;
    }

    /**
     * Atribui uma vaga a um apartamento
     * @param {Apartment} apartment - Apartamento
     * @param {Object} spotData - Dados da vaga/par {type, spot?/pair?}
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object} - {success: boolean, garage: Garage, apartment: Apartment, message: string, spotType?: string, vagaNumero?: number}
     */
    assignSpot(apartment, spotData, garage) {
        try {
            // Validar entrada
            const validation = this.validationService.validateAssignment(apartment, spotData, garage);
            if (!validation.valid) {
                return {
                    success: false,
                    garage: garage,
                    apartment: apartment,
                    message: validation.message
                };
            }

            // Criar cópias para manter imutabilidade
            const updatedGarage = garage.clone();
            const updatedApartment = apartment.clone();

            // Remover vagas anteriores se apartamento já tem vagas
            if (updatedApartment.hasVagas()) {
                this._removeExistingVagas(updatedApartment, updatedGarage);
                console.log(`🔄 Vagas anteriores removidas do apartamento ${updatedApartment.id}`);
            }

            // Atribuir nova vaga baseado no tipo
            let result;
            if (spotData.type === 'simple') {
                result = this._assignSimpleSpot(updatedApartment, spotData.spot, updatedGarage);
            } else if (spotData.type === 'double') {
                result = this._assignDoubleSpot(updatedApartment, spotData.pair, updatedGarage);
            } else if (spotData.type === 'extended') {
                result = this._assignExtendedSpot(updatedApartment, spotData.spot, updatedGarage);
            } else {
                return {
                    success: false,
                    garage: garage,
                    apartment: apartment,
                    message: `Tipo de vaga inválido: ${spotData.type}`
                };
            }

            if (result.success) {
                console.log(`✅ ${result.message}`);
                return {
                    success: true,
                    garage: updatedGarage,
                    apartment: updatedApartment,
                    message: result.message,
                    spotType: result.spotType,
                    vagaNumero: result.vagaNumero,
                    apartmentId: updatedApartment.id
                };
            } else {
                return {
                    success: false,
                    garage: garage,
                    apartment: apartment,
                    message: result.message
                };
            }

        } catch (error) {
            return {
                success: false,
                garage: garage,
                apartment: apartment,
                message: `Erro interno: ${error.message}`
            };
        }
    }

    /**
     * Atribui vaga simples
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Spot} spot - Vaga
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da operação
     */
    _assignSimpleSpot(apartment, spot, garage) {
        // Ocupar vaga na garagem
        const success = garage.occupySpot(spot.id, apartment.id);
        if (!success) {
            return {
                success: false,
                message: `Falha ao ocupar vaga ${spot.id}`
            };
        }

        // Adicionar vaga ao apartamento
        apartment.addVaga(spot.id);

        console.log(`✅ Vaga única ${spot.id} atribuída ao apartamento ${apartment.id}`);

        return {
            success: true,
            message: `Vaga ${spot.id} aplicada com sucesso ao apartamento ${apartment.id}`,
            spotType: 'normal',
            vagaNumero: spot.id
        };
    }

    /**
     * Atribui par duplo
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Object} pair - Par de vagas
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da operação
     */
    _assignDoubleSpot(apartment, pair, garage) {
        // Ocupar ambas vagas do par
        const successA = garage.occupySpot(pair.aId, apartment.id);
        const successB = garage.occupySpot(pair.bId, apartment.id);

        if (!successA || !successB) {
            // Reverter operações se alguma falhou
            if (successA) garage.freeSpot(pair.aId);
            if (successB) garage.freeSpot(pair.bId);

            return {
                success: false,
                message: `Falha ao ocupar par ${pair.id}`
            };
        }

        // Adicionar ambas vagas ao apartamento
        apartment.addVaga(pair.aId);
        apartment.addVaga(pair.bId);

        console.log(`✅ Par duplo ${pair.id} (vagas ${pair.aId}, ${pair.bId}) atribuído ao apartamento ${apartment.id}`);

        return {
            success: true,
            message: `Vaga ${null} aplicada com sucesso ao apartamento ${apartment.id}`,
            spotType: 'duplo',
            vagaNumero: null // Para pares, não há um número único
        };
    }

    /**
     * Atribui vaga estendida
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Spot} spot - Vaga estendida
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da operação
     */
    _assignExtendedSpot(apartment, spot, garage) {
        // Ocupar vaga estendida na garagem
        const success = garage.occupySpot(spot.id, apartment.id);
        if (!success) {
            return {
                success: false,
                message: `Falha ao ocupar vaga estendida ${spot.id}`
            };
        }

        // Adicionar vaga ao apartamento
        apartment.addVaga(spot.id);

        console.log(`✅ Vaga única ${spot.id} atribuída ao apartamento ${apartment.id}`);

        return {
            success: true,
            message: `Vaga ${spot.id} aplicada com sucesso ao apartamento ${apartment.id}`,
            spotType: 'estendido',
            vagaNumero: spot.id
        };
    }

    /**
     * Remove vagas existentes de um apartamento
     * @private
     * @param {Apartment} apartment - Apartamento
     * @param {Garage} garage - Garagem
     */
    _removeExistingVagas(apartment, garage) {
        // Liberar todas as vagas atuais do apartamento na garagem
        apartment.vagas.forEach(vagaId => {
            garage.freeSpot(vagaId);
        });

        // Limpar vagas do apartamento
        apartment.clearVagas();
    }

    /**
     * Verifica se apartamento já tem vagas atribuídas
     * @param {Apartment} apartment - Apartamento a verificar
     * @returns {boolean}
     */
    hasExistingAssignment(apartment) {
        return apartment && apartment.hasVagas();
    }

    /**
     * Remove todas as vagas de um apartamento
     * @param {Apartment} apartment - Apartamento
     * @param {Garage} garage - Garagem
     * @returns {Object} - Resultado da operação
     */
    removeAllAssignments(apartment, garage) {
        if (!apartment || !garage) {
            return {
                success: false,
                message: 'Apartamento e garagem são obrigatórios'
            };
        }

        try {
            const updatedGarage = garage.clone();
            const updatedApartment = apartment.clone();

            if (updatedApartment.hasVagas()) {
                this._removeExistingVagas(updatedApartment, updatedGarage);

                return {
                    success: true,
                    garage: updatedGarage,
                    apartment: updatedApartment,
                    message: `Todas as vagas removidas do apartamento ${apartment.id}`
                };
            }

            return {
                success: true,
                garage: updatedGarage,
                apartment: updatedApartment,
                message: `Apartamento ${apartment.id} não tinha vagas atribuídas`
            };

        } catch (error) {
            return {
                success: false,
                garage: garage,
                apartment: apartment,
                message: `Erro ao remover vagas: ${error.message}`
            };
        }
    }
}

export default SpotAssignmentService;