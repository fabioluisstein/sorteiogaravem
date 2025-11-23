/**
 * @fileoverview Modelo de dados para Vaga
 * @description Define a estrutura e comportamento básico de uma vaga no sistema de sorteio
 */

/**
 * Tipos de vaga no sistema
 * @readonly
 * @enum {string}
 */
export const SpotType = {
    VAGA: 'VAGA',
    CORREDOR: 'CORREDOR',
    MURO: 'MURO'
};

/**
 * Classe modelo para representar uma vaga de garagem
 * @class Spot
 */
export class Spot {
    /**
     * Cria uma nova instância de Vaga
     * @param {number|string} id - ID da vaga (numérico sequencial)
     * @param {string} floor - Andar (G1, G2, G3)
     * @param {string} side - Lado (A, B, C, D, E, F)
     * @param {number} pos - Posição no lado (1-7)
     * @param {string} [type='VAGA'] - Tipo da vaga
     */
    constructor(id, floor, side, pos, type = SpotType.VAGA) {
        this.id = id;
        this.floor = floor;
        this.side = side;
        this.pos = pos;
        this.type = type;
        this.blocked = false;
        this.occupiedBy = null;
        this.parId = null; // Será definido externamente se faz parte de um par
    }

    /**
     * Verifica se a vaga está livre
     * @returns {boolean}
     */
    isFree() {
        return !this.blocked && !this.occupiedBy && this.type === SpotType.VAGA;
    }

    /**
     * Verifica se a vaga está ocupada
     * @returns {boolean}
     */
    isOccupied() {
        return this.occupiedBy !== null;
    }

    /**
     * Verifica se a vaga está bloqueada
     * @returns {boolean}
     */
    isBlocked() {
        return this.blocked;
    }

    /**
     * Ocupa a vaga com um apartamento
     * @param {number} apartmentId - ID do apartamento
     * @returns {Spot} - Retorna this para chaining
     */
    occupyBy(apartmentId) {
        if (this.isFree()) {
            this.occupiedBy = apartmentId;
        }
        return this;
    }

    /**
     * Libera a vaga
     * @returns {Spot} - Retorna this para chaining
     */
    free() {
        this.occupiedBy = null;
        return this;
    }

    /**
     * Bloqueia a vaga
     * @returns {Spot} - Retorna this para chaining
     */
    block() {
        this.blocked = true;
        return this;
    }

    /**
     * Desbloqueia a vaga
     * @returns {Spot} - Retorna this para chaining
     */
    unblock() {
        this.blocked = false;
        return this;
    }

    /**
     * Define o ID do par ao qual esta vaga pertence
     * @param {string} parId - ID do par
     * @returns {Spot} - Retorna this para chaining
     */
    setPair(parId) {
        this.parId = parId;
        return this;
    }

    /**
     * Verifica se a vaga faz parte de um par
     * @returns {boolean}
     */
    isPartOfPair() {
        return this.parId !== null;
    }

    /**
     * Verifica se é uma vaga estendida baseado em configuração externa
     * @param {Function} isExtendedSpot - Função para verificar se é estendida
     * @returns {boolean}
     */
    isExtended(isExtendedSpot) {
        return isExtendedSpot ? isExtendedSpot(this.id) : false;
    }

    /**
     * Cria uma cópia da vaga
     * @returns {Spot}
     */
    clone() {
        const clone = new Spot(this.id, this.floor, this.side, this.pos, this.type);
        clone.blocked = this.blocked;
        clone.occupiedBy = this.occupiedBy;
        clone.parId = this.parId;
        return clone;
    }

    /**
     * Converte a vaga para representação JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            floor: this.floor,
            side: this.side,
            pos: this.pos,
            type: this.type,
            blocked: this.blocked,
            occupiedBy: this.occupiedBy,
            parId: this.parId
        };
    }

    /**
     * Cria vaga a partir de dados JSON
     * @param {Object} data - Dados da vaga
     * @returns {Spot}
     */
    static fromJSON(data) {
        const spot = new Spot(data.id, data.floor, data.side, data.pos, data.type);
        spot.blocked = data.blocked || false;
        spot.occupiedBy = data.occupiedBy || null;
        spot.parId = data.parId || null;
        return spot;
    }
}

export default Spot;