/**
 * @fileoverview Modelo de dados para Apartamento
 * @description Define a estrutura e comportamento básico de um apartamento no sistema de sorteio
 */

/**
 * Tipos de apartamento baseados na configuração do sistema
 * @readonly
 * @enum {string}
 */
export const ApartmentType = {
    SIMPLES: 'simples',
    DUPLO: 'duplo',
    ESTENDIDO: 'estendido'
};

/**
 * Classe modelo para representar um apartamento
 * @class Apartment
 */
export class Apartment {
    /**
     * Cria uma nova instância de Apartamento
     * @param {number} id - ID numérico do apartamento (ex: 101, 202, 303)
     * @param {string} apartmentNumber - Número do apartamento como string
     * @param {boolean} [ativo=true] - Se o apartamento está ativo para sorteio
     * @param {boolean} [dupla=false] - Se o apartamento tem direito a vaga dupla
     */
    constructor(id, apartmentNumber, ativo = true, dupla = false) {
        this.id = id;
        this.apartmentNumber = apartmentNumber;
        this.ativo = ativo;
        this.dupla = dupla;
        this.sorteado = false;
        this.vagas = [];
    }

    /**
     * Marca o apartamento como sorteado
     * @returns {Apartment} - Retorna this para chaining
     */
    markAsDrawn() {
        this.sorteado = true;
        return this;
    }

    /**
     * Verifica se o apartamento está disponível para sorteio
     * @returns {boolean}
     */
    isAvailableForDraw() {
        return this.ativo && !this.sorteado;
    }

    /**
     * Adiciona uma vaga ao apartamento
     * @param {number|string} vagaId - ID da vaga
     * @returns {Apartment} - Retorna this para chaining
     */
    addVaga(vagaId) {
        if (!this.vagas.includes(vagaId)) {
            this.vagas.push(vagaId);
        }
        return this;
    }

    /**
     * Remove todas as vagas do apartamento
     * @returns {Apartment} - Retorna this para chaining
     */
    clearVagas() {
        this.vagas = [];
        return this;
    }

    /**
     * Verifica se o apartamento já tem vaga(s) atribuída(s)
     * @returns {boolean}
     */
    hasVagas() {
        return this.vagas.length > 0;
    }

    /**
     * Determina o tipo do apartamento baseado nas suas propriedades
     * Requer configuração externa para apartamentos estendidos
     * @param {Function} [isExtendedApartment] - Função para determinar se é estendido
     * @returns {string} - Tipo do apartamento (ApartmentType)
     */
    getType(isExtendedApartment = null) {
        if (isExtendedApartment && isExtendedApartment(this.id)) {
            return ApartmentType.ESTENDIDO;
        }
        return this.dupla ? ApartmentType.DUPLO : ApartmentType.SIMPLES;
    }

    /**
     * Cria uma cópia do apartamento
     * @returns {Apartment}
     */
    clone() {
        const clone = new Apartment(this.id, this.apartmentNumber, this.ativo, this.dupla);
        clone.sorteado = this.sorteado;
        clone.vagas = [...this.vagas];
        clone.estendido = this.estendido || false; // ✅ Incluir propriedade estendido
        return clone;
    }

    /**
     * Converte o apartamento para representação JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            apartmentNumber: this.apartmentNumber,
            ativo: this.ativo,
            dupla: this.dupla,
            estendido: this.estendido || false, // ✅ Incluir propriedade estendido
            sorteado: this.sorteado,
            vagas: [...this.vagas]
        };
    }

    /**
     * Cria apartamento a partir de dados JSON
     * @param {Object} data - Dados do apartamento
     * @returns {Apartment}
     */
    static fromJSON(data) {
        const apartment = new Apartment(data.id, data.apartmentNumber, data.ativo, data.dupla);
        apartment.sorteado = data.sorteado || false;
        apartment.vagas = data.vagas || [];
        apartment.estendido = data.estendido || false; // ✅ Adicionar propriedade estendido
        return apartment;
    }
}

export default Apartment;