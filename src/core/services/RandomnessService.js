/**
 * @fileoverview Serviço de Aleatorização
 * @description Implementa funcionalidades de randomização com seed para reprodutibilidade
 */

import { IRandomnessService } from '../interfaces/IServices.js';

/**
 * Serviço de aleatorização com suporte a seed
 * Implementa Dependency Inversion - outros serviços dependem da interface, não da implementação
 * 
 * @class RandomnessService
 * @implements {IRandomnessService}
 */
export class RandomnessService extends IRandomnessService {
    /**
     * @param {number} [seed] - Seed para reprodutibilidade dos resultados
     */
    constructor(seed = null) {
        super();
        this.seed = seed;
        this._rng = this._createRNG(seed);
    }

    /**
     * Cria um gerador de números aleatórios com seed
     * @private
     * @param {number} seed - Seed inicial
     * @returns {Function} - Função geradora de números aleatórios
     */
    _createRNG(seed) {
        if (seed === null) {
            return Math.random;
        }

        // Implementação de LCG (Linear Congruential Generator) para seed
        let currentSeed = seed;
        return function () {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }

    /**
     * Embaralha um array usando algoritmo Fisher-Yates
     * @param {Array} array - Array a ser embaralhado
     * @returns {Array} - Nova instância do array embaralhado
     */
    shuffle(array) {
        if (!Array.isArray(array) || array.length <= 1) {
            return [...array];
        }

        const shuffled = [...array];

        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this._rng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * Seleciona um item aleatório de um array
     * @param {Array} array - Array de onde selecionar
     * @returns {*} - Item selecionado ou undefined se array vazio
     */
    selectRandom(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return undefined;
        }

        const index = Math.floor(this._rng() * array.length);
        return array[index];
    }

    /**
     * Gera um número inteiro aleatório entre min e max (inclusive)
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} - Número aleatório
     */
    randomInt(min, max) {
        return Math.floor(this._rng() * (max - min + 1)) + min;
    }

    /**
     * Gera um número decimal aleatório entre 0 e 1
     * @returns {number} - Número aleatório entre 0 e 1
     */
    random() {
        return this._rng();
    }

    /**
     * Gera um número decimal aleatório entre min e max
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} - Número aleatório
     */
    randomFloat(min, max) {
        return this._rng() * (max - min) + min;
    }

    /**
     * Define um novo seed
     * @param {number} seed - Novo seed
     */
    setSeed(seed) {
        this.seed = seed;
        this._rng = this._createRNG(seed);
    }

    /**
     * Retorna o seed atual
     * @returns {number} - Seed atual
     */
    getSeed() {
        return this.seed;
    }
}

export default RandomnessService;