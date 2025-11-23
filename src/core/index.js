/**
 * @fileoverview Ponto de entrada para o sistema de sorteio SOLID
 * @description Exporta todas as classes e interfaces do sistema
 */

// === MODELOS ===
export { Apartment, ApartmentType } from './models/Apartment.js';
export { Spot, SpotType } from './models/Spot.js';
export { Garage } from './models/Garage.js';

// === INTERFACES ===
export {
    IApartmentSelector,
    IApartmentTypeDetector,
    ISpotSelector,
    ISpotAssigner,
    ILotteryOrchestrator,
    ISpotSelectionStrategy,
    IRandomnessService,
    IValidationService
} from './interfaces/IServices.js';

// === SERVIÇOS ===
export { ApartmentSelectionService } from './services/ApartmentSelectionService.js';
export { ApartmentTypeService } from './services/ApartmentTypeService.js';
export { SpotSelectionService } from './services/SpotSelectionService.js';
export { SpotAssignmentService } from './services/SpotAssignmentService.js';
export { LotteryOrchestrator } from './services/LotteryOrchestrator.js';
export { RandomnessService } from './services/RandomnessService.js';
export { ValidationService } from './services/ValidationService.js';

// === ESTRATÉGIAS ===
export {
    SimpleSpotSelectionStrategy,
    DoubleSpotSelectionStrategy,
    ExtendedSpotSelectionStrategy
} from './strategies/SpotSelectionStrategies.js';

// === IMPORTS PARA USO INTERNO DA FACTORY ===
import { ApartmentSelectionService } from './services/ApartmentSelectionService.js';
import { ApartmentTypeService } from './services/ApartmentTypeService.js';
import { SpotSelectionService } from './services/SpotSelectionService.js';
import { SpotAssignmentService } from './services/SpotAssignmentService.js';
import { LotteryOrchestrator } from './services/LotteryOrchestrator.js';
import { RandomnessService } from './services/RandomnessService.js';
import { ValidationService } from './services/ValidationService.js';

// === FACTORY PARA INSTANCIAÇÃO FÁCIL ===

/**
 * Factory para criar uma instância completa do sistema de sorteio
 * @class LotterySystemFactory
 */
export class LotterySystemFactory {
    /**
     * Cria um sistema de sorteio completamente configurado
     * @param {Object} config - Configuração do sistema
     * @param {number} [config.seed] - Seed para randomização
     * @param {Function} [config.isExtendedApartmentFn] - Função para detectar apartamentos estendidos
     * @param {Function} [config.isExtendedSpotFn] - Função para detectar vagas estendidas
     * @returns {Object} - Sistema completo com todos os serviços
     */
    static createSystem(config = {}) {
        const {
            seed = null,
            isExtendedApartmentFn = null,
            isExtendedSpotFn = null
        } = config;

        // Criar serviços fundamentais
        const randomnessService = new RandomnessService(seed);
        const validationService = new ValidationService();

        // Criar serviços específicos
        const apartmentSelector = new ApartmentSelectionService(randomnessService);
        const typeDetector = new ApartmentTypeService(isExtendedApartmentFn);
        const spotSelector = new SpotSelectionService(randomnessService, isExtendedSpotFn, typeDetector);
        const spotAssigner = new SpotAssignmentService(validationService);

        // Criar orquestrador principal
        const orchestrator = new LotteryOrchestrator(
            apartmentSelector,
            typeDetector,
            spotSelector,
            spotAssigner
        );

        return {
            // Orquestrador principal
            orchestrator,

            // Serviços individuais
            services: {
                apartmentSelector,
                typeDetector,
                spotSelector,
                spotAssigner,
                randomnessService,
                validationService
            },

            // Métodos de conveniência
            executeSorting: (apartments, garage) => orchestrator.executeSorting(apartments, garage),
            aplicarVagaAoApartamento: (apartment, spotData, garage) =>
                orchestrator.aplicarVagaAoApartamento(apartment, spotData, garage),
            getStatistics: (apartments, garage) => orchestrator.getSystemStatistics(apartments, garage),
            canContinue: (apartments, garage) => orchestrator.canContinueSorting(apartments, garage),

            // Configuração
            config: {
                seed,
                isExtendedApartmentFn,
                isExtendedSpotFn
            }
        };
    }

    /**
     * Cria um sistema básico para testes
     * @returns {Object} - Sistema básico configurado
     */
    static createBasicSystem() {
        return this.createSystem({
            seed: 12345,
            isExtendedApartmentFn: (id) => [303, 403, 503, 603, 703].includes(id),
            isExtendedSpotFn: (id) => [7, 8, 21, 22, 35, 36].includes(id)
        });
    }
}

// Export default para uso direto
export default LotterySystemFactory;