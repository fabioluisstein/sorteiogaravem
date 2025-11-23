/**
 * @fileoverview Serviço de Sorteio Simplificado
 * @description Implementa sorteio direto sem pré-reservas, sempre selecionando vagas disponíveis do tipo correto
 */

/**
 * Serviço de Sorteio Simplificado - Elimina complexidade de pré-reservas
 * 
 * REGRAS FUNDAMENTAIS:
 * 1. Apartamentos sorteados aleatoriamente um por vez
 * 2. Para cada apartamento: identificar tipo → buscar vagas compatíveis → sortear aleatoriamente
 * 3. Atribuição imediata → remoção da lista de disponíveis
 * 4. SEM pré-reservas, SEM vinculações específicas, SEM bloqueios retroativos
 */
export class SimpleLotteryService {
    /**
     * @param {IRandomnessService} randomnessService - Serviço de aleatorização
     * @param {Function} isExtendedSpotFn - Função para verificar se vaga é estendida
     * @param {Function} isExtendedApartmentFn - Função para verificar se apartamento é estendido
     */
    constructor(randomnessService, isExtendedSpotFn, isExtendedApartmentFn) {
        this.randomnessService = randomnessService;
        this.isExtendedSpotFn = isExtendedSpotFn;
        this.isExtendedApartmentFn = isExtendedApartmentFn;
    }

    /**
     * Executa sorteio completo de forma simplificada
     * @param {Array} apartments - Lista de apartamentos para sorteio
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Resultado do sorteio
     */
    executeLottery(apartments, garage) {
        console.log('🎲 ===== INICIANDO SORTEIO SIMPLIFICADO =====');

        // 1. Inicializar array de pares duplos disponíveis na garagem
        garage.initializeDoublePairsList(this.isExtendedSpotFn);

        // 2. Preparar listas internas de vagas disponíveis
        const availableSpots = this.prepareAvailableSpots(garage);

        console.log('📋 Listas iniciais:');
        console.log(`   🔹 Vagas simples: ${availableSpots.simples.length}`);
        console.log(`   🔸 Vagas estendidas: ${availableSpots.estendidas.length}`);
        console.log(`   🔹 Pares duplos: ${garage.getAvailableDoublePairsCount()}`); // 🎯 NOVO

        // 3. Criar cópia dos apartamentos para sorteio
        const apartmentsToSort = apartments
            .filter(apt => apt.ativo && !apt.sorteado)
            .map(apt => ({ ...apt }));

        console.log(`🏠 Apartamentos para sortear: ${apartmentsToSort.length}`);

        const results = [];
        const errors = [];

        // 3. LOOP PRINCIPAL: sortear apartamentos um por vez
        while (apartmentsToSort.length > 0) {
            // 3.1. Sortear próximo apartamento aleatoriamente
            const randomIndex = Math.floor(this.randomnessService.random() * apartmentsToSort.length);
            const selectedApartment = apartmentsToSort[randomIndex];
            apartmentsToSort.splice(randomIndex, 1);

            console.log(`\n🎯 Sorteando apartamento ${selectedApartment.id}...`);

            // 3.2. Identificar tipo do apartamento
            const apartmentType = this.determineApartmentType(selectedApartment);
            console.log(`   📍 Tipo: ${apartmentType.toUpperCase()}`);

            // 3.3. Buscar vagas compatíveis e sortear
            const result = this.selectCompatibleSpot(selectedApartment, apartmentType, availableSpots, garage);

            if (result.success) {
                // 3.4. Atribuir vaga e remover da lista de disponíveis
                this.assignSpotToApartment(selectedApartment, result, availableSpots, garage);
                results.push(result);
                console.log(`   ✅ ${result.message}`);
            } else {
                // 3.5. Registrar erro se não há vagas compatíveis
                errors.push({
                    apartmentId: selectedApartment.id,
                    apartmentType,
                    error: result.error
                });
                console.log(`   ❌ ${result.error}`);
            }
        }

        console.log('\n🏁 ===== SORTEIO FINALIZADO =====');
        console.log(`✅ Sucessos: ${results.length}`);
        console.log(`❌ Erros: ${errors.length}`);

        return {
            success: errors.length === 0,
            results,
            errors,
            summary: {
                totalProcessed: results.length + errors.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    /**
     * Prepara listas internas de vagas disponíveis por tipo
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Listas de vagas disponíveis
     */
    prepareAvailableSpots(garage) {
        const spots = garage.getFreeSpots();
        const pairs = garage.getFreePairs(); // 🎯 Não mais usado para duplos

        // Separar vagas por tipo (com prioridade: estendidas primeiro)
        const estendidas = spots.filter(spot =>
            spot.isExtended(this.isExtendedSpotFn)
        );

        const simples = spots.filter(spot =>
            !spot.isExtended(this.isExtendedSpotFn) && // Não é estendida
            !this.isSpotPartOfPair(spot.id, pairs) // Não faz parte de par duplo
        );

        // 🎯 NOVO: Pares duplos agora gerenciados pelo array da garagem
        // Não precisa mais calcular aqui - usa garage.availableDoublePairs

        return {
            simples: simples.map(s => s.id),
            estendidas: estendidas.map(s => s.id)
            // 🎯 REMOVIDO: paresDuplos agora está no garage.availableDoublePairs
        };
    }

    /**
     * Verifica se uma vaga faz parte de algum par
     * @param {number} spotId - ID da vaga
     * @param {Array} pairs - Lista de pares
     * @returns {boolean}
     */
    isSpotPartOfPair(spotId, pairs) {
        return pairs.some(pair => pair.aId === spotId || pair.bId === spotId);
    }

    /**
     * Determina o tipo do apartamento
     * @param {Object} apartment - Apartamento
     * @returns {string} - Tipo do apartamento
     */
    determineApartmentType(apartment) {
        if (this.isExtendedApartmentFn && this.isExtendedApartmentFn(apartment.id)) {
            return 'estendido';
        }
        if (apartment.dupla) {
            return 'duplo';
        }
        return 'simples';
    }

    /**
     * Seleciona vaga compatível com o tipo do apartamento
     * @param {Object} apartment - Apartamento
     * @param {string} apartmentType - Tipo do apartamento
     * @param {Object} availableSpots - Listas de vagas disponíveis
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Resultado da seleção
     */
    selectCompatibleSpot(apartment, apartmentType, availableSpots, garage) {
        switch (apartmentType) {
            case 'simples':
                return this.selectSimpleSpot(apartment, availableSpots.simples);

            case 'duplo':
                return this.selectDoubleSpot(apartment, garage); // 🎯 NOVO: passa garagem

            case 'estendido':
                return this.selectExtendedSpot(apartment, availableSpots.estendidas);

            default:
                return {
                    success: false,
                    error: `Tipo de apartamento inválido: ${apartmentType}`
                };
        }
    }

    /**
     * Seleciona vaga simples aleatoriamente
     * @param {Object} apartment - Apartamento
     * @param {Array} simpleSpots - Lista de vagas simples disponíveis
     * @returns {Object} - Resultado da seleção
     */
    selectSimpleSpot(apartment, simpleSpots) {
        if (simpleSpots.length === 0) {
            return {
                success: false,
                error: `Não há vagas simples disponíveis para apartamento ${apartment.id}`
            };
        }

        const randomIndex = Math.floor(this.randomnessService.random() * simpleSpots.length);
        const selectedSpotId = simpleSpots[randomIndex];

        return {
            success: true,
            type: 'simple',
            apartmentId: apartment.id,
            spotId: selectedSpotId,
            message: `Vaga simples ${selectedSpotId} sorteada para apartamento ${apartment.id}`
        };
    }

    /**
     * 🎯 NOVO: Seleciona par duplo usando array simples
     * @param {Object} apartment - Apartamento
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Resultado da seleção
     */
    selectDoubleSpot(apartment, garage) {
        if (!garage.hasDoublePairs()) {
            return {
                success: false,
                error: `Não há pares duplos disponíveis para apartamento ${apartment.id}`
            };
        }

        // 🎯 Usar o método da garagem que já remove o par da lista
        const selectedPair = garage.useDoublePair();

        if (!selectedPair) {
            return {
                success: false,
                error: `Erro ao obter par duplo para apartamento ${apartment.id}`
            };
        }

        return {
            success: true,
            type: 'double',
            apartmentId: apartment.id,
            pairId: selectedPair.id,
            pairData: selectedPair, // 🎯 Inclui dados completos do par
            message: `Par duplo ${selectedPair.id} sorteado para apartamento ${apartment.id}`
        };
    }

    /**
     * Seleciona vaga estendida aleatoriamente
     * @param {Object} apartment - Apartamento
     * @param {Array} extendedSpots - Lista de vagas estendidas disponíveis
     * @returns {Object} - Resultado da seleção
     */
    selectExtendedSpot(apartment, extendedSpots) {
        if (extendedSpots.length === 0) {
            return {
                success: false,
                error: `Não há vagas estendidas disponíveis para apartamento ${apartment.id}`
            };
        }

        const randomIndex = Math.floor(this.randomnessService.random() * extendedSpots.length);
        const selectedSpotId = extendedSpots[randomIndex];

        return {
            success: true,
            type: 'extended',
            apartmentId: apartment.id,
            spotId: selectedSpotId,
            message: `Vaga estendida ${selectedSpotId} sorteada para apartamento ${apartment.id}`
        };
    }

    /**
     * Atribui vaga ao apartamento e remove das listas de disponíveis
     * @param {Object} apartment - Apartamento
     * @param {Object} result - Resultado da seleção
     * @param {Object} availableSpots - Listas de vagas disponíveis
     * @param {Garage} garage - Estado da garagem
     */
    assignSpotToApartment(apartment, result, availableSpots, garage) {
        if (result.type === 'simple' || result.type === 'extended') {
            // Atribuir vaga única
            garage.occupySpot(result.spotId, apartment.id);

            // Remover das listas apropriadas
            if (result.type === 'simple') {
                const index = availableSpots.simples.indexOf(result.spotId);
                if (index > -1) availableSpots.simples.splice(index, 1);
            } else {
                const index = availableSpots.estendidas.indexOf(result.spotId);
                if (index > -1) availableSpots.estendidas.splice(index, 1);
            }

        } else if (result.type === 'double') {
            // 🎯 NOVO: Atribuir par duplo - O par já foi removido do array pela garagem
            const pair = result.pairData || garage.findPair(result.pairId);
            if (pair) {
                garage.occupySpot(pair.aId, apartment.id);
                garage.occupySpot(pair.bId, apartment.id);

                // 🎯 NOVO: Não precisa mais remover da lista paresDuplos - já removido por useDoublePair()
                // Apenas remover as vagas individuais das listas simples (se estiverem lá)
                const indexA = availableSpots.simples.indexOf(pair.aId);
                if (indexA > -1) availableSpots.simples.splice(indexA, 1);

                const indexB = availableSpots.simples.indexOf(pair.bId);
                if (indexB > -1) availableSpots.simples.splice(indexB, 1);
            }
        }
    }
}

export default SimpleLotteryService;