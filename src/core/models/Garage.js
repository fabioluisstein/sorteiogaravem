/**
 * @fileoverview Modelo de dados para Garagem
 * @description Define a estrutura e comportamento básico de uma garagem no sistema de sorteio
 */

import { Spot } from './Spot.js';

/**
 * Classe modelo para representar uma garagem completa
 * @class Garage
 */
export class Garage {
    /**
     * Cria uma nova instância de Garagem
     * @param {Spot[]} spots - Array de vagas
     * @param {Object} pairs - Objeto com pares de vagas {parId: {id, floor, side, aPos, bPos, aId, bId, reservedFor}}
     */
    constructor(spots = [], pairs = {}) {
        this.spots = spots;
        this.pairs = pairs;
        this.extendedReservations = {};
        this.doublePairReservations = {}; // Reservas para apartamentos duplos
    }

    /**
     * Adiciona uma vaga à garagem
     * @param {Spot} spot - Vaga a ser adicionada
     * @returns {Garage} - Retorna this para chaining
     */
    addSpot(spot) {
        if (spot instanceof Spot) {
            this.spots.push(spot);
        }
        return this;
    }

    /**
     * Adiciona um par de vagas
     * @param {string} parId - ID do par
     * @param {Object} pairData - Dados do par
     * @returns {Garage} - Retorna this para chaining
     */
    addPair(parId, pairData) {
        this.pairs[parId] = pairData;
        return this;
    }

    /**
     * Encontra uma vaga pelo ID
     * @param {number|string} spotId - ID da vaga
     * @returns {Spot|null}
     */
    findSpot(spotId) {
        return this.spots.find(spot => spot.id === spotId) || null;
    }

    /**
     * Encontra um par pelo ID
     * @param {string} parId - ID do par
     * @returns {Object|null}
     */
    findPair(parId) {
        return this.pairs[parId] || null;
    }

    /**
     * Método unificado para obter vagas/pares disponíveis para um apartamento específico
     * @param {Apartment} apartment - Apartamento que será sorteado
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     * @returns {Object} - { spots: Spot[], pairs: Object[] } - Vagas e pares disponíveis para este apartamento
     */
    getAvailableOptionsForApartment(apartment, isExtendedSpotFn) {
        const result = {
            spots: [],
            pairs: [],
            type: null
        };

        if (apartment.dupla) {
            // APARTAMENTO DUPLO: Apenas pares disponíveis (incluindo pré-reservados para duplos)
            result.type = 'double';
            result.pairs = this.getAvailablePairsForDoubleApartments(true)
                .filter(pair => {
                    // Excluir pares com vagas estendidas
                    const aIsExtended = isExtendedSpotFn && isExtendedSpotFn(pair.aId);
                    const bIsExtended = isExtendedSpotFn && isExtendedSpotFn(pair.bId);
                    return !aIsExtended && !bIsExtended;
                });
            
            console.log(`🏢 Apartamento ${apartment.id} (DUPLO): ${result.pairs.length} pares disponíveis`);
            
        } else if (apartment.isExtended && apartment.isExtended(isExtendedSpotFn)) {
            // APARTAMENTO ESTENDIDO: Apenas vagas estendidas
            result.type = 'extended';
            result.spots = this.getFreeExtendedSpots(isExtendedSpotFn);
            
            console.log(`🏢 Apartamento ${apartment.id} (ESTENDIDO): ${result.spots.length} vagas estendidas disponíveis`);
            
        } else {
            // APARTAMENTO SIMPLES: Vagas normais (excluindo estendidas e vagas de pares pré-reservados)
            result.type = 'simple';
            result.spots = this.getFreeNormalSpots(isExtendedSpotFn);
            
            console.log(`🏢 Apartamento ${apartment.id} (SIMPLES): ${result.spots.length} vagas simples disponíveis`);
        }

        return result;
    }

    /**
     * Retorna todas as vagas livres
     * @returns {Spot[]}
     */
    getFreeSpots() {
        return this.spots.filter(spot => spot.isFree());
    }

    /**
     * Retorna vagas livres filtradas por função
     * @param {Function} filterFn - Função de filtro
     * @returns {Spot[]}
     */
    getFilteredFreeSpots(filterFn) {
        return this.getFreeSpots().filter(filterFn);
    }

    /**
     * Retorna pares livres (não reservados e com ambas as vagas livres)
     * @returns {Object[]}
     */
    getFreePairs() {
        return Object.values(this.pairs).filter(pair => {
            // Verificar se o par não está reservado
            if (pair.reservedFor) {
                return false;
            }

            // Verificar se ambas as vagas do par estão livres
            const spotA = this.spots.find(spot => spot.id === pair.aId);
            const spotB = this.spots.find(spot => spot.id === pair.bId);

            return spotA && spotA.isFree() && spotB && spotB.isFree();
        });
    }

    /**
     * Retorna pares livres filtrados por função
     * @param {Function} filterFn - Função de filtro
     * @returns {Object[]}
     */
    getFilteredFreePairs(filterFn) {
        return this.getFreePairs().filter(filterFn);
    }

    /**
     * Retorna vagas estendidas baseado em função de configuração
     * @param {Function} isExtendedSpot - Função para verificar se vaga é estendida
     * @returns {Spot[]}
     */
    getExtendedSpots(isExtendedSpot) {
        return this.spots.filter(spot => spot.isExtended(isExtendedSpot));
    }

    /**
     * Retorna vagas estendidas livres
     * @param {Function} isExtendedSpot - Função para verificar se vaga é estendida
     * @returns {Spot[]}
     */
    getFreeExtendedSpots(isExtendedSpot) {
        return this.getExtendedSpots(isExtendedSpot).filter(spot => spot.isFree());
    }

    /**
     * Retorna vagas normais (não estendidas) livres
     * @param {Function} isExtendedSpot - Função para verificar se vaga é estendida
     * @returns {Spot[]}
     */
    getFreeNormalSpots(isExtendedSpot) {
        return this.getFreeSpots().filter(spot => {
            // Excluir vagas estendidas
            if (spot.isExtended(isExtendedSpot)) {
                return false;
            }

            // Excluir vagas que fazem parte de pares pré-reservados para apartamentos duplos
            for (const [pairId, reservation] of Object.entries(this.doublePairReservations)) {
                if (reservation.priority === 'double') {
                    const pair = this.pairs[pairId];
                    if (pair && (pair.aId === spot.id || pair.bId === spot.id)) {
                        console.log(`🚫 Vaga ${spot.id} bloqueada para apartamentos simples (faz parte do par reservado ${pairId})`);
                        return false; // Vaga faz parte de par reservado para duplo
                    }
                }
            }

            return true;
        });
    }

    /**
     * Ocupa uma vaga por um apartamento
     * @param {number|string} spotId - ID da vaga
     * @param {number} apartmentId - ID do apartamento
     * @returns {boolean} - True se sucesso
     */
    occupySpot(spotId, apartmentId) {
        const spot = this.findSpot(spotId);
        if (spot && spot.isFree()) {
            spot.occupyBy(apartmentId);
            return true;
        }
        return false;
    }

    /**
     * Libera uma vaga
     * @param {number|string} spotId - ID da vaga
     * @returns {boolean} - True se sucesso
     */
    freeSpot(spotId) {
        const spot = this.findSpot(spotId);
        if (spot && spot.isOccupied()) {
            spot.free();
            return true;
        }
        return false;
    }

    /**
     * Reserva um par para um apartamento
     * @param {string} parId - ID do par
     * @param {number} apartmentId - ID do apartamento
     * @returns {boolean} - True se sucesso
     */
    reservePair(parId, apartmentId) {
        const pair = this.findPair(parId);
        if (pair && !pair.reservedFor) {
            pair.reservedFor = apartmentId;
            return true;
        }
        return false;
    }

    /**
     * Libera reserva de um par
     * @param {string} parId - ID do par
     * @returns {boolean} - True se sucesso
     */
    freePairReservation(parId) {
        const pair = this.findPair(parId);
        if (pair && pair.reservedFor) {
            pair.reservedFor = null;
            return true;
        }
        return false;
    }

    /**
     * Pré-reserva pares suficientes para garantir apartamentos duplos
     * @param {number} doublePairCount - Quantidade de apartamentos duplos que precisam de pares
     * @returns {boolean} - true se conseguiu reservar pares suficientes
     */
    preReserveDoublePairs(doublePairCount) {
        if (doublePairCount <= 0) {
            return true;
        }

        // Obter pares livres (que não estão ocupados nem pré-reservados)
        const availablePairs = this.getFreePairs().filter(pair => 
            !this.doublePairReservations[pair.id]
        );

        if (availablePairs.length < doublePairCount) {
            console.log(`🚫 Não há pares suficientes: ${availablePairs.length} disponíveis, ${doublePairCount} necessários`);
            return false;
        }

        // Reservar os primeiros N pares disponíveis
        const pairsToReserve = availablePairs.slice(0, doublePairCount);
        
        for (const pair of pairsToReserve) {
            this.doublePairReservations[pair.id] = {
                reservedAt: new Date(),
                priority: 'double',
                vagas: [pair.aId, pair.bId] // Para debug
            };
        }

        console.log(`✅ Pré-reservados ${doublePairCount} pares para apartamentos duplos: ${pairsToReserve.map(p => `${p.id}(${p.aId},${p.bId})`).join(', ')}`);
        return true;
    }

    /**
     * Libera uma pré-reserva de par duplo (quando o apartamento é efetivamente sorteado)
     * @param {string} pairId - ID do par a ser liberado da pré-reserva
     * @returns {boolean} - true se a reserva foi liberada
     */
    releaseDoublePairReservation(pairId) {
        if (this.doublePairReservations[pairId]) {
            delete this.doublePairReservations[pairId];
            console.log(`🔓 Pré-reserva do par ${pairId} liberada para uso efetivo`);
            return true;
        }
        return false;
    }

    /**
     * Verifica se um par está pré-reservado para apartamentos duplos
     * @param {string} pairId - ID do par
     * @returns {boolean}
     */
    isDoublePairReserved(pairId) {
        return !!this.doublePairReservations[pairId];
    }

    /**
     * Obtém pares livres considerando pré-reservas de apartamentos duplos
     * @param {boolean} includeReserved - Se true, inclui pares pré-reservados
     * @returns {Array} Lista de pares disponíveis
     */
    getAvailablePairsForDoubleApartments(includeReserved = true) {
        const freePairs = this.getFreePairs();
        
        if (includeReserved) {
            // Para apartamentos duplos, incluir pares pré-reservados
            return freePairs.filter(pair => 
                !this.doublePairReservations[pair.id] || 
                this.doublePairReservations[pair.id].priority === 'double'
            );
        } else {
            // Para outros tipos, excluir pares pré-reservados
            return freePairs.filter(pair => 
                !this.doublePairReservations[pair.id]
            );
        }
    }

    /**
     * Clona a garagem incluindo as pré-reservas
     * @returns {Garage}
     */
    clone() {
        const clonedSpots = this.spots.map(spot => spot.clone());
        const clonedPairs = {};
        for (const [parId, pairData] of Object.entries(this.pairs)) {
            clonedPairs[parId] = { ...pairData };
        }
        const clonedGarage = new Garage(clonedSpots, clonedPairs);
        clonedGarage.extendedReservations = { ...this.extendedReservations };
        clonedGarage.doublePairReservations = { ...this.doublePairReservations };
        return clonedGarage;
    }

    /**
     * Converte a garagem para representação JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            spots: this.spots.map(spot => spot.toJSON()),
            pairs: this.pairs,
            extendedReservations: this.extendedReservations
        };
    }

    /**
     * Cria garagem a partir de dados JSON
     * @param {Object} data - Dados da garagem
     * @returns {Garage}
     */
    static fromJSON(data) {
        const spots = data.spots.map(spotData => Spot.fromJSON(spotData));
        const garage = new Garage(spots, data.pairs || {});
        garage.extendedReservations = data.extendedReservations || {};
        return garage;
    }
}

export default Garage;