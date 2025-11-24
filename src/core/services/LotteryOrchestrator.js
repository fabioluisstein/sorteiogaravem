/**
 * @fileoverview TASK 6 - Orquestrador do Sorteio (Fluxo Principal)
 * @description Coordena todo o fluxo de sorteio seguindo exatamente os 4 passos
 */

import { ILotteryOrchestrator } from '../interfaces/IServices.js';
import { getVagasProibidasDuplo } from '../../config/sorteioConfig.js'; // 🎯 NOVO

/**
 * Orquestrador do sorteio de garagem
 * Implementa Facade Pattern para simplificar uso dos serviços
 * 
 * TASK 6 CRITÉRIOS:
 * - Fluxo deve seguir exatamente os 4 passos: sortear → identificar → sortear vaga → aplicar
 * - Retornar dados específicos de cada passo
 * - Nenhuma reserva prévia deve ser recalculada
 * - Não deve haver loops internos de correção
 * - Execução silenciosa (sem inputs do usuário)
 * 
 * @class LotteryOrchestrator
 * @implements {ILotteryOrchestrator}
 */
export class LotteryOrchestrator extends ILotteryOrchestrator {
    /**
     * @param {IApartmentSelector} apartmentSelector - Serviço de seleção de apartamentos
     * @param {IApartmentTypeDetector} typeDetector - Serviço de detecção de tipos
     * @param {ISpotSelector} spotSelector - Serviço de seleção de vagas
     * @param {ISpotAssigner} spotAssigner - Serviço de atribuição de vagas
     */
    constructor(apartmentSelector, typeDetector, spotSelector, spotAssigner) {
        super();
        this.apartmentSelector = apartmentSelector;
        this.typeDetector = typeDetector;
        this.spotSelector = spotSelector;
        this.spotAssigner = spotAssigner;
    }

    /**
     * Executa o fluxo completo de sorteio seguindo os 4 passos obrigatórios
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @param {Garage} garage - Estado atual da garagem
     * @returns {Object} - Resultado do sorteio com dados de cada passo
     */
    executeSorting(apartments, garage) {
        try {
            // ========== PASSO 1: SORTEAR APARTAMENTO ==========
            const selectedApartment = this.apartmentSelector.selectRandomApartment(apartments);

            if (!selectedApartment) {
                // 🎉 Verificar se todos os apartamentos foram sorteados
                const apartmentosDisponiveis = apartments.filter(apt => apt.isAvailableForDraw());
                const todosApartamentosSorteados = apartmentosDisponiveis.length === 0;

                if (todosApartamentosSorteados) {
                    return {
                        success: true,
                        step: 1,
                        message: '🎉 Sorteio foi finalizado com sucesso. Todos os apartamentos foram sorteados',
                        apartment: null,
                        apartmentType: null,
                        spotData: null,
                        assignmentResult: null,
                        allApartmentsSorted: true
                    };
                } else {
                    return {
                        success: false,
                        step: 1,
                        message: 'Nenhum apartamento disponível para sorteio',
                        apartment: null,
                        apartmentType: null,
                        spotData: null,
                        assignmentResult: null
                    };
                }
            }

            // ========== PASSO 2: IDENTIFICAR TIPO ==========
            const apartmentType = this.typeDetector.determineType(selectedApartment);

            // ========== PASSO 3: SORTEAR VAGA ==========
            const spotData = this.spotSelector.selectSpot(selectedApartment, garage);

            if (!spotData) {
                return {
                    success: false,
                    step: 3,
                    message: `Nenhuma vaga disponível para apartamento ${apartmentType}`,
                    apartment: selectedApartment,
                    apartmentType: apartmentType,
                    spotData: null,
                    assignmentResult: null
                };
            }

            // ========== PASSO 4: APLICAR VAGA ==========
            const assignmentResult = this.spotAssigner.assignSpot(selectedApartment, spotData, garage);

            if (!assignmentResult.success) {
                return {
                    success: false,
                    step: 4,
                    message: assignmentResult.message,
                    apartment: selectedApartment,
                    apartmentType: apartmentType,
                    spotData: spotData,
                    assignmentResult: assignmentResult
                };
            }

            // Marcar apartamento como sorteado após sucesso completo
            this.apartmentSelector.markAsDrawn(selectedApartment);

            // ========== SUCESSO: RETORNAR DADOS DE TODOS OS PASSOS ==========
            return {
                success: true,
                step: 4,
                message: `Sorteio concluído com sucesso para apartamento ${selectedApartment.id}`,
                apartment: selectedApartment,
                apartmentType: apartmentType,
                spotData: spotData,
                assignmentResult: assignmentResult
            };

        } catch (error) {
            return {
                success: false,
                step: 0,
                message: `Erro durante execução do sorteio: ${error.message}`,
                apartment: null,
                apartmentType: null,
                spotData: null,
                assignmentResult: null,
                error: error.message
            };
        }
    }

    /**
     * TASK 5 - Método específico aplicarVagaAoApartamento
     * Implementa o método exigido pelo TASK 5 usando os serviços internos
     * @param {Apartment} apartment - Apartamento
     * @param {Object} spotData - Dados da vaga/par
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Resultado da aplicação
     */
    aplicarVagaAoApartamento(apartment, spotData, garage) {
        console.log(`🎯 TASK 5 - Aplicando vaga ao apartamento ${apartment.id}...`);

        try {
            // Usar o serviço de atribuição diretamente
            const result = this.spotAssigner.assignSpot(apartment, spotData, garage);

            return {
                success: result.success,
                updatedGarage: result.garage,
                updatedApartments: [result.apartment], // Formato esperado pelos testes antigos
                message: result.message,
                spot: result.spotData?.spot || null,
                apartmentId: result.apartmentId,
                vagaNumero: result.vagaNumero,
                spotType: result.spotType
            };
        } catch (error) {
            return {
                success: false,
                updatedGarage: garage,
                updatedApartments: [apartment],
                message: `Erro ao aplicar vaga: ${error.message}`
            };
        }
    }

    /**
     * Executa múltiplos sorteios até esgotar apartamentos ou vagas
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @param {Garage} garage - Estado inicial da garagem
     * @param {number} [maxDraws=100] - Máximo de sorteios para evitar loops infinitos
     * @returns {Object} - Resultado com histórico de sorteios
     */
    executeMultipleSortings(apartments, garage, maxDraws = 100) {
        const results = [];
        let currentGarage = garage.clone();
        let drawCount = 0;

        // ========== PRÉ-RESERVA PARA APARTAMENTOS DUPLOS (COM FILTRAGEM) ==========
        const doubleApartments = apartments.filter(apt => apt.dupla && apt.isAvailableForDraw());
        const doublePairCount = doubleApartments.length;

        if (doublePairCount > 0) {
            // 🎯 NOVO: Obter vagas proibidas (base + estendidas)
            const vagasProibidasDuplo = getVagasProibidasDuplo();

            // Usar sistema de pré-reserva com filtragem de vagas proibidas
            const preReserveSuccess = currentGarage.preReserveDoublePairs(doublePairCount, vagasProibidasDuplo);
            if (!preReserveSuccess) {
                console.log(`⚠️ Não foi possível pré-reservar ${doublePairCount} pares para apartamentos duplos`);
                return {
                    totalDraws: 0,
                    successfulDraws: 0,
                    failedDraws: 1,
                    results: [{
                        success: false,
                        step: 0,
                        message: `Não há pares suficientes para ${doublePairCount} apartamentos duplos`,
                        apartment: null,
                        apartmentType: null,
                        spotData: null,
                        assignmentResult: null
                    }],
                    finalGarage: currentGarage
                };
            }
        }

        while (drawCount < maxDraws) {
            const result = this.executeSorting(apartments, currentGarage);
            results.push(result);

            // Se o resultado indica que todos os apartamentos foram sorteados (sucesso de finalização)
            if (result.allApartmentsSorted) {
                console.log('🎉 Sorteio foi finalizado com sucesso.');
                console.log('✅ Todos os apartamentos foram sorteados');
                break;
            }

            if (!result.success) {
                // Parar se não há mais apartamentos ou vagas disponíveis
                break;
            }

            // Atualizar estado da garagem para próximo sorteio
            currentGarage = result.assignmentResult.garage;
            drawCount++;
        }

        // 🎉 VERIFICAR SE TODOS OS APARTAMENTOS FORAM SORTEADOS (final status)
        const apartmentosDisponiveis = apartments.filter(apt => apt.isAvailableForDraw());
        const todosApartamentosSorteados = apartmentosDisponiveis.length === 0;

        return {
            totalDraws: drawCount,
            successfulDraws: results.filter(r => r.success).length,
            failedDraws: results.filter(r => !r.success).length,
            results: results,
            finalGarage: currentGarage,
            allApartmentsSorted: todosApartamentosSorteados // 🎯 Nova propriedade
        };
    }

    /**
     * Retorna estatísticas atuais do sistema
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Estatísticas detalhadas
     */
    getSystemStatistics(apartments, garage) {
        return {
            apartments: this.apartmentSelector.getStatistics(apartments),
            spots: this.spotSelector.getAvailabilityStatistics(garage),
            garage: {
                totalSpots: garage.spots.length,
                freeSpots: garage.getFreeSpots().length,
                totalPairs: Object.keys(garage.pairs).length,
                freePairs: garage.getFreePairs().length
            }
        };
    }

    /**
     * Valida se é possível continuar o sorteio
     * @param {Apartment[]} apartments - Lista de apartamentos
     * @param {Garage} garage - Estado da garagem
     * @returns {Object} - Resultado da validação
     */
    canContinueSorting(apartments, garage) {
        const hasApartments = this.apartmentSelector.hasAvailableApartments(apartments);
        const hasSpots = garage.getFreeSpots().length > 0;

        return {
            canContinue: hasApartments && hasSpots,
            hasApartments: hasApartments,
            hasSpots: hasSpots,
            message: !hasApartments ? 'Sem apartamentos disponíveis' :
                !hasSpots ? 'Sem vagas disponíveis' :
                    'Sorteio pode continuar'
        };
    }
}

export default LotteryOrchestrator;