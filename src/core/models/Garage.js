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
        this.doublePairReservations = {}; // Reservas para apartamentos duplos (LEGADO)
        this.availableDoublePairs = []; // 🎯 NOVO: Array simples de pares duplos disponíveis
    }

    /**
     * 🎯 NOVO: Inicializa lista simples de pares duplos disponíveis
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     */
    initializeDoublePairsList(isExtendedSpotFn) {
        this.availableDoublePairs = this.getFreePairs()
            .filter(pair => {
                // Excluir pares com vagas estendidas
                const spotA = this.findSpot(pair.aId);
                const spotB = this.findSpot(pair.bId);

                if (!spotA || !spotB) return false;

                const aIsExtended = spotA.isExtended(isExtendedSpotFn);
                const bIsExtended = spotB.isExtended(isExtendedSpotFn);

                return !aIsExtended && !bIsExtended;
            })
            .map(pair => pair.id); // Só os IDs dos pares

        console.log(`📋 Lista de pares duplos inicializada: ${this.availableDoublePairs.length} pares disponíveis`);
        console.log(`   Pares: ${this.availableDoublePairs.join(', ')}`);
    }

    /**
     * 🎯 NOVO: Usar um par duplo (remove da lista)
     * @returns {Object|null} - Par usado ou null se não há mais pares
     */
    useDoublePair() {
        if (this.availableDoublePairs.length === 0) {
            console.log('🚫 Nenhum par duplo disponível na lista');
            return null; // Acabaram os pares
        }

        // Remove e retorna o primeiro par da lista
        const pairId = this.availableDoublePairs.shift();
        const pair = this.pairs[pairId];

        console.log(`🎯 Usando par duplo ${pairId} (restam ${this.availableDoublePairs.length} pares)`);
        return pair;
    }

    /**
     * 🎯 NOVO: Verificar se há pares duplos disponíveis
     * @returns {boolean}
     */
    hasDoublePairs() {
        return this.availableDoublePairs.length > 0;
    }

    /**
     * 🎯 NOVO: Obter quantidade de pares duplos disponíveis
     * @returns {number}
     */
    getAvailableDoublePairsCount() {
        return this.availableDoublePairs.length;
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
        // Primeiro tenta buscar nos pares legacy
        let pair = this.pairs[parId];

        // Se não encontrou, busca nos pares oficiais
        if (!pair) {
            const officialPairs = this.getValidDoubleSpotPairs();
            pair = officialPairs.find(p => p.id === parId);
        }

        return pair || null;
    }

    /**
     * Método unificado para obter vagas/pares disponíveis para um apartamento específico
     * @param {Apartment} apartment - Apartamento que será sorteado
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     * @returns {Object} - { spots: Spot[], pairs: Object[] } - Vagas e pares disponíveis para este apartamento
     */
    getAvailableOptionsForApartment(apartment, isExtendedSpotFn, isExtendedApartmentFn) {
        const result = {
            spots: [],
            pairs: [],
            type: null
        };

        // Detectar se é apartamento estendido usando a função externa
        const isExtendedApartment = isExtendedApartmentFn && isExtendedApartmentFn(apartment.id);

        if (apartment.dupla) {
            // APARTAMENTO DUPLO: Apenas pares disponíveis (incluindo pré-reservados para duplos)
            result.type = 'double';

            // 🔍 DEBUG: Analisar estado dos pares
            const allPairs = Object.values(this.pairs);
            const freePairs = this.getFreePairs();
            const preReservedPairs = Object.keys(this.doublePairReservations);

            console.log(`🔍 DEBUG Par para apto ${apartment.id}:`);
            console.log(`   - Total de pares definidos: ${allPairs.length}`);
            console.log(`   - Pares livres (vagas não ocupadas): ${freePairs.length}`);
            console.log(`   - Pares pré-reservados: ${preReservedPairs.length} [${preReservedPairs.join(', ')}]`);

            result.pairs = this.getAvailablePairsForDoubleApartments(true)
                .filter(pair => {
                    // Excluir pares com vagas estendidas
                    const aIsExtended = isExtendedSpotFn && isExtendedSpotFn(pair.aId);
                    const bIsExtended = isExtendedSpotFn && isExtendedSpotFn(pair.bId);
                    const hasExtended = aIsExtended || bIsExtended;

                    if (hasExtended) {
                        console.log(`   - Par ${pair.id} (${pair.aId},${pair.bId}) excluído: tem vaga estendida`);
                    }

                    return !hasExtended;
                });

            console.log(`   - Pares finais após filtros: ${result.pairs.length}`);
            console.log(`🏢 Apartamento ${apartment.id} (DUPLO): ${result.pairs.length} pares disponíveis`);

        } else if (isExtendedApartment) {
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
     * IMPORTANTE: Agora usa APENAS os pares naturais oficiais da especificação
     * @returns {Object[]}
     */
    getFreePairs() {
        // Usar apenas os pares oficiais da especificação
        const officialPairs = this.getValidDoubleSpotPairs();

        return officialPairs.filter(pair => {
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
     * PROTEGE vagas que fazem parte de pares ainda necessários para apartamentos duplos
     * @param {Function} isExtendedSpot - Função para verificar se vaga é estendida
     * @returns {Spot[]}
     */
    getFreeNormalSpots(isExtendedSpot) {
        return this.getFreeSpots().filter(spot => {
            // Excluir vagas estendidas
            if (spot.isExtended(isExtendedSpot)) {
                return false;
            }

            // 🎯 PROTEÇÃO DE PARES: Verificar APENAS pares efetivamente pré-reservados
            for (const [pairId, reservation] of Object.entries(this.doublePairReservations)) {
                if (reservation.priority === 'double') {
                    // Extrair IDs das vagas do par pré-reservado (usando 'vagas' não 'spotIds')
                    const vagas = reservation.vagas || [];

                    if (vagas.includes(spot.id)) {
                        console.log(`🚫 Vaga ${spot.id} protegida para apartamentos duplos (faz parte do par ${pairId})`);
                        return false; // Proteger vaga para duplos
                    }
                }
            } return true;
        });
    }

    /**
     * Verifica se uma vaga faz parte de um par natural válido
     * @param {Spot} spot - Vaga a verificar
     * @returns {boolean}
     */
    isPartOfValidNaturalPair(spot) {
        // Posições que formam pares naturais: 1-2, 3-4, 5-6
        const naturalPairPositions = [[1, 2], [3, 4], [5, 6]];

        return naturalPairPositions.some(([pos1, pos2]) => {
            return spot.pos === pos1 || spot.pos === pos2;
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
     * 🎯 OFICIAL: Retorna os pares naturais válidos conforme especificação técnica
     * Implementa EXATAMENTE os 18 pares definidos na especificação oficial
     * @returns {Array} - Lista dos 18 pares naturais oficiais
     */
    getValidDoubleSpotPairs() {
        // ✅ PARES NATURAIS OFICIAIS (conforme especificação técnica)
        const paresNaturaisOficiais = [
            [1, 2], [3, 4], [5, 6],         // G1-A
            [9, 10], [11, 12], [13, 14],    // G1-B  
            [15, 16], [17, 18], [19, 20],   // G2-C
            [23, 24], [25, 26], [27, 28],   // G2-D
            [29, 30], [31, 32], [33, 34],   // G3-E
            [37, 38], [39, 40], [41, 42]    // G3-F
        ];

        // Converter para objetos pair compatíveis com o sistema
        const validPairs = [];

        for (const [aId, bId] of paresNaturaisOficiais) {
            // Encontrar os spots correspondentes
            const spotA = this.findSpot(aId);
            const spotB = this.findSpot(bId);

            if (spotA && spotB) {
                // Verificar se ambos os spots estão livres
                if (spotA.isFree() && spotB.isFree()) {
                    validPairs.push({
                        id: `OFICIAL-${aId}-${bId}`,
                        aId, bId,
                        floor: spotA.floor,
                        side: spotA.side,
                        aPos: spotA.pos,
                        bPos: spotB.pos,
                        reservedFor: null,
                        isOfficial: true // Marcador de par oficial
                    });
                }
            }
        }

        console.log(`🎯 Pares naturais oficiais encontrados: ${validPairs.length}/18`);
        return validPairs;
    }

    /**
     * 🎯 Pré-reserva pares duplos para apartamentos duplos (SEM vinculação direta)
     * Aplica as regras técnicas obrigatórias:
     * 1. USA APENAS os pares naturais oficiais da especificação
     * 2. Exclui vagas proibidas (vagas_proibidas_duplo)  
     * 3. Reserva exatamente a quantidade necessária
     * @param {number} doublePairCount - Quantidade de apartamentos duplos que precisam de pares
     * @param {number[]} vagasProibidasDuplo - Lista de vagas proibidas para pares duplos
     * @returns {boolean} - true se conseguiu reservar pares suficientes
     */
    preReserveDoublePairs(doublePairCount, vagasProibidasDuplo = []) {
        if (doublePairCount <= 0) {
            return true;
        }

        console.log(`🔄 Tentando pré-reservar ${doublePairCount} pares para apartamentos duplos...`);
        console.log(`🚫 Vagas proibidas para duplos: ${vagasProibidasDuplo.join(', ')}`);

        // 🎯 USAR APENAS PARES NATURAIS OFICIAIS
        let availablePairs = this.getValidDoubleSpotPairs()
            .filter(pair => !this.doublePairReservations[pair.id]);

        console.log(`📊 Pares naturais oficiais disponíveis: ${availablePairs.length}`);

        // 🎯 FILTRAR pares que contêm vagas proibidas
        const paresAntesFiltro = availablePairs.length;
        availablePairs = availablePairs.filter(pair => {
            const vagaAProibida = vagasProibidasDuplo.includes(pair.aId);
            const vagaBProibida = vagasProibidasDuplo.includes(pair.bId);

            if (vagaAProibida || vagaBProibida) {
                console.log(`🚫 Par oficial ${pair.aId}-${pair.bId} excluído: contém vaga proibida`);
                return false;
            }

            return true;
        });

        console.log(`📊 Pares após filtrar proibidas: ${availablePairs.length} (excluídos: ${paresAntesFiltro - availablePairs.length})`);

        // 🎯 VERIFICAR se há pares suficientes
        if (availablePairs.length < doublePairCount) {
            console.error(`🚫 Não há pares suficientes para ${doublePairCount} apartamentos duplos restantes.`);
            console.error(`   Pares oficiais válidos disponíveis: ${availablePairs.length}`);
            console.error(`   Apartamentos duplos necessários: ${doublePairCount}`);
            throw new Error(`Não há pares naturais oficiais válidos suficientes: ${availablePairs.length} disponíveis, ${doublePairCount} necessários`);
        }

        // 🎯 RESERVAR exatamente a quantidade necessária
        const pairsToReserve = availablePairs.slice(0, doublePairCount);

        for (const pair of pairsToReserve) {
            this.doublePairReservations[pair.id] = {
                reservedAt: new Date(),
                priority: 'double',
                vagas: [pair.aId, pair.bId],
                isOfficialPair: true, // Marcador de par oficial
                // ✅ SEM apartmentId - qualquer apartamento duplo pode usar
            };
        }

        console.log(`✅ Pré-reservados ${doublePairCount} pares naturais OFICIAIS para apartamentos duplos:`);
        pairsToReserve.forEach(pair => {
            console.log(`   ${pair.aId}-${pair.bId} (${pair.floor}${pair.side}, posições ${pair.aPos}-${pair.bPos})`);
        });

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

        console.log(`🔍 DEBUG getAvailablePairsForDoubleApartments:`);
        console.log(`   - Pares livres encontrados: ${freePairs.length}`);
        console.log(`   - Include reserved: ${includeReserved}`);

        if (includeReserved) {
            // Para apartamentos duplos, incluir pares pré-reservados
            const result = freePairs.filter(pair => {
                const isNotReserved = !this.doublePairReservations[pair.id];
                const isReservedForDouble = this.doublePairReservations[pair.id]?.priority === 'double';
                const shouldInclude = isNotReserved || isReservedForDouble;

                console.log(`   - Par ${pair.id}: reserved=${!!this.doublePairReservations[pair.id]} priority=${this.doublePairReservations[pair.id]?.priority || 'none'} include=${shouldInclude}`);

                return shouldInclude;
            });

            console.log(`   - Resultado final: ${result.length} pares`);
            return result;
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