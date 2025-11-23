/**
 * @fileoverview TASK 2 - Serviço de Detecção de Tipos de Apartamento
 * @description Identifica se apartamento é simples, duplo ou estendido baseado na configuração
 */

import { IApartmentTypeDetector } from '../interfaces/IServices.js';
import { ApartmentType } from '../models/Apartment.js';

/**
 * Serviço para detecção de tipos de apartamento
 * Implementa Single Responsibility - foca apenas na identificação de tipos
 * 
 * TASK 2 CRITÉRIOS:
 * - Identificar apartamento SIMPLES (padrão)
 * - Identificar apartamento DUPLO (baseado na propriedade dupla)
 * - Identificar apartamento ESTENDIDO (baseado em configuração externa)
 * - Retornar string com tipo correto
 * 
 * @class ApartmentTypeService
 * @implements {IApartmentTypeDetector}
 */
export class ApartmentTypeService extends IApartmentTypeDetector {
    /**
     * @param {Function} [isExtendedApartmentFn] - Função para determinar se apartamento é estendido
     */
    constructor(isExtendedApartmentFn = null) {
        super();
        this.isExtendedApartmentFn = isExtendedApartmentFn;
    }

    /**
     * Determina o tipo de um apartamento
     * @param {Apartment} apartment - Apartamento a ser analisado
     * @returns {string} - Tipo do apartamento ('simples', 'duplo', 'estendido')
     */
    determineType(apartment) {
        // Validação de entrada
        if (!apartment || typeof apartment.id === 'undefined') {
            throw new Error('Apartamento inválido fornecido para determinação de tipo');
        }

        // Prioridade: ESTENDIDO > DUPLO > SIMPLES

        // 1. Verificar se é ESTENDIDO (baseado em configuração externa)
        if (this.isExtendedApartmentFn && this.isExtendedApartmentFn(apartment.id)) {
            return ApartmentType.ESTENDIDO;
        }

        // 2. Verificar se é DUPLO (baseado na propriedade dupla)
        if (apartment.dupla === true) {
            return ApartmentType.DUPLO;
        }

        // 3. Default: SIMPLES
        return ApartmentType.SIMPLES;
    }

    /**
     * Verifica se apartamento é do tipo especificado
     * @param {Apartment} apartment - Apartamento a verificar
     * @param {string} expectedType - Tipo esperado
     * @returns {boolean}
     */
    isOfType(apartment, expectedType) {
        try {
            const actualType = this.determineType(apartment);
            return actualType === expectedType;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verifica se apartamento é simples
     * @param {Apartment} apartment - Apartamento a verificar
     * @returns {boolean}
     */
    isSimples(apartment) {
        return this.isOfType(apartment, ApartmentType.SIMPLES);
    }

    /**
     * Verifica se apartamento é duplo
     * @param {Apartment} apartment - Apartamento a verificar
     * @returns {boolean}
     */
    isDuplo(apartment) {
        return this.isOfType(apartment, ApartmentType.DUPLO);
    }

    /**
     * Verifica se apartamento é estendido
     * @param {Apartment} apartment - Apartamento a verificar
     * @returns {boolean}
     */
    isEstendido(apartment) {
        return this.isOfType(apartment, ApartmentType.ESTENDIDO);
    }

    /**
     * Filtra apartamentos por tipo
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @param {string} type - Tipo desejado
     * @returns {Apartment[]} - Apartamentos do tipo especificado
     */
    filterByType(apartments, type) {
        if (!Array.isArray(apartments)) {
            return [];
        }

        return apartments.filter(apartment => {
            try {
                return this.determineType(apartment) === type;
            } catch (error) {
                return false;
            }
        });
    }

    /**
     * Retorna estatísticas de tipos de apartamentos
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @returns {Object} - Contadores por tipo
     */
    getTypeStatistics(apartments) {
        if (!Array.isArray(apartments)) {
            return {
                [ApartmentType.SIMPLES]: 0,
                [ApartmentType.DUPLO]: 0,
                [ApartmentType.ESTENDIDO]: 0,
                total: 0
            };
        }

        const stats = {
            [ApartmentType.SIMPLES]: 0,
            [ApartmentType.DUPLO]: 0,
            [ApartmentType.ESTENDIDO]: 0,
            total: apartments.length
        };

        apartments.forEach(apartment => {
            try {
                const type = this.determineType(apartment);
                stats[type]++;
            } catch (error) {
                // Ignorar apartamentos inválidos
            }
        });

        return stats;
    }

    /**
     * Define ou atualiza a função de detecção de apartamentos estendidos
     * @param {Function} isExtendedApartmentFn - Nova função de detecção
     */
    setExtendedApartmentFunction(isExtendedApartmentFn) {
        this.isExtendedApartmentFn = isExtendedApartmentFn;
    }

    /**
     * Verifica se tem função de detecção de apartamentos estendidos configurada
     * @returns {boolean}
     */
    hasExtendedApartmentFunction() {
        return typeof this.isExtendedApartmentFn === 'function';
    }
}

export default ApartmentTypeService;