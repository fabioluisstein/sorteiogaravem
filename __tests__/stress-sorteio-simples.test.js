import { SorteioSimples } from '../src/SorteioSimples.js';

// Repetições para stress; reduzir se for necessário
const ITERATIONS = 1000;
const VIP_CHOICES = [3, 4, 5, 6, 9, 10, 11, 12, 13, 14];

describe('Stress test - SorteioSimples (validação apto 303)', () => {
    test(`Executar ${ITERATIONS} sorteios e validar apto 303 recebe somente VIP_CHOICES`, () => {
        for (let i = 0; i < ITERATIONS; i++) {
            const s = new SorteioSimples();
            const result = s.sorteio();

            expect(result).toBeDefined();
            expect(result.sucesso).toBe(true);

            const r303 = result.resultados.find(r => r.apartamento === 303);
            if (r303) {
                const vaga = r303.vagas && r303.vagas[0];
                // Se apto 303 foi sorteado, a vaga deve estar nas VIP_CHOICES
                expect(VIP_CHOICES.includes(vaga)).toBe(true);
            }
        }
    }, 300000);
});
