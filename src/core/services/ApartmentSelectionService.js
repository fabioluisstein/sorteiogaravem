/**
 * @fileoverview TASK 1 - Serviço de Seleção de Apartamentos
 * @description Implementa seleção aleatória de apartamentos seguindo princípios SOLID
 */

import { IApartmentSelector } from '../interfaces/IServices.js';

/**
 * Serviço para seleção aleatória de apartamentos
 * Implementa Single Responsibility Principle - foca apenas na seleção de apartamentos
 * 
 * TASK 1 CRITÉRIOS:
 * - Nunca deve retornar apartamento já sorteado
 * - Nunca deve retornar apartamento inativo  
 * - Deve retornar exatamente 1 apartamento
 * - RandomService.shuffle deve ser chamado (ordem randômica)
 * - Deve retornar null quando não há mais apartamentos
 * 
 * @class ApartmentSelectionService
 * @implements {IApartmentSelector}
 */
export class ApartmentSelectionService extends IApartmentSelector {
    /**
     * @param {IRandomnessService} randomnessService - Serviço de aleatorização
     */
    constructor(randomnessService) {
        super();
        this.randomnessService = randomnessService;
    }

    /**
     * Seleciona um apartamento aleatório da lista de disponíveis
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @returns {Apartment|null} - Apartamento selecionado ou null se nenhum disponível
     */
    selectRandomApartment(apartments) {
        // Validação de entrada
        if (!apartments || !Array.isArray(apartments) || apartments.length === 0) {
            console.log('🏁 Não há mais apartamentos disponíveis para sorteio');
            return null;
        }

        // Filtrar apenas apartamentos disponíveis (ativos e não sorteados)
        const availableApartments = apartments.filter(apartment =>
            apartment.isAvailableForDraw()
        );

        // Verificar se há apartamentos disponíveis
        if (availableApartments.length === 0) {
            console.log('🏁 Não há mais apartamentos disponíveis para sorteio');
            return null;
        }

        // Embaralhar lista para garantir randomização (CRITÉRIO: RandomService.shuffle deve ser chamado)
        const shuffledApartments = this.randomnessService.shuffle([...availableApartments]);

        // Selecionar o primeiro da lista embaralhada (garantindo exatamente 1 apartamento)
        const selectedApartment = shuffledApartments[0];

        // Log para debugging
        console.log(`🎲 Apartamento ${selectedApartment.id} selecionado aleatoriamente (${availableApartments.length} disponíveis)`);

        return selectedApartment;
    }

    /**
     * Marca um apartamento como sorteado
     * @param {Apartment} apartment - Apartamento a ser marcado
     * @returns {boolean} - True se sucesso
     */
    markAsDrawn(apartment) {
        if (!apartment) {
            return false;
        }

        apartment.markAsDrawn();
        return true;
    }

    /**
     * Retorna estatísticas dos apartamentos
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @returns {Object} - Estatísticas
     */
    getStatistics(apartments) {
        if (!apartments || !Array.isArray(apartments)) {
            return {
                total: 0,
                available: 0,
                drawn: 0,
                inactive: 0
            };
        }

        const total = apartments.length;
        const available = apartments.filter(apt => apt.isAvailableForDraw()).length;
        const drawn = apartments.filter(apt => apt.sorteado).length;
        const inactive = apartments.filter(apt => !apt.ativo).length;

        return {
            total,
            available,
            drawn,
            inactive
        };
    }

    /**
     * Verifica se há apartamentos disponíveis para sorteio
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @returns {boolean}
     */
    hasAvailableApartments(apartments) {
        return apartments &&
            Array.isArray(apartments) &&
            apartments.some(apartment => apartment.isAvailableForDraw());
    }
}

export default ApartmentSelectionService;