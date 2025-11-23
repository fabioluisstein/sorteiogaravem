/**
 * @fileoverview Demo de Teste - Validação Básica das Regras de Sorteio
 * @description Demonstra as validações principais em formato simplificado
 */

// Simulação das classes necessárias para o teste
class MockSpot {
    constructor(id, floor, side, position, type) {
        this.id = id;
        this.floor = floor;
        this.side = side;
        this.position = position;
        this.type = type;
        this.reservedBy = null;
    }
}

class MockApartment {
    constructor(id, name, active, isDuplo) {
        this.id = id;
        this.name = name;
        this.ativo = active;
        this.dupla = isDuplo;
        this.sorteado = false;
    }

    isAvailableForDraw() {
        return this.ativo && !this.sorteado;
    }
}

class MockGarage {
    constructor(spots, pairs) {
        this.spots = spots;
        this.pairs = pairs;
    }
}

describe('🎯 Demo - Validação das Regras do Sorteio Flor de Lis', () => {
    // ==================== CONFIGURAÇÃO DE DADOS ====================

    const VAGAS_ESTENDIDAS = [7, 8, 21, 22, 35, 36];
    const APARTAMENTOS_DUPLOS = [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702];
    const APARTAMENTOS_ESTENDIDOS = [303, 403, 503, 603, 703];

    // Pares fisicamente válidos (CORRIGIDO: sem usar vagas estendidas)
    const PARES_VALIDOS = [
        { ids: [1, 2], name: 'G1-A-1-2' },
        { ids: [3, 4], name: 'G1-A-3-4' },
        { ids: [5, 6], name: 'G1-A-5-6' },
        // { ids: [8, 9], name: 'G1-B-1-2' }, // REMOVIDO: usa vaga 8 (estendida)
        { ids: [9, 10], name: 'G1-B-1-2' },  // CORRIGIDO: usar 9-10
        { ids: [11, 12], name: 'G1-B-3-4' }, // CORRIGIDO: usar 11-12
        { ids: [13, 14], name: 'G1-B-5-6' }, // CORRIGIDO: usar 13-14
        { ids: [15, 16], name: 'G2-C-1-2' },
        { ids: [17, 18], name: 'G2-C-3-4' },
        { ids: [19, 20], name: 'G2-C-5-6' },
        // Pular vagas 21-22 (estendidas)
        { ids: [23, 24], name: 'G2-D-1-2' }, // ADICIONADO
        { ids: [25, 26], name: 'G2-D-3-4' }, // ADICIONADO
        { ids: [27, 28], name: 'G2-D-5-6' }, // ADICIONADO
        { ids: [29, 30], name: 'G3-E-1-2' },
        { ids: [31, 32], name: 'G3-E-3-4' },
        { ids: [33, 34], name: 'G3-E-5-6' },
        // Pular vagas 35-36 (estendidas)
        { ids: [37, 38], name: 'G3-F-1-2' }, // CORRIGIDO
        { ids: [39, 40], name: 'G3-F-3-4' }, // CORRIGIDO
        { ids: [41, 42], name: 'G3-F-5-6' }  // ADICIONADO
    ];

    let garagem, apartamentos;

    beforeEach(() => {
        // Criar todas as 42 vagas
        const spots = [];
        for (let i = 1; i <= 42; i++) {
            spots.push(new MockSpot(i, `G${Math.ceil(i / 14)}`, 'TEST', i, 'VAGA'));
        }

        // Criar apenas os pares válidos
        const pairs = {};
        for (const { ids, name } of PARES_VALIDOS) {
            pairs[name] = {
                id: name,
                aId: ids[0],
                bId: ids[1],
                reservedFor: null
            };
        }

        garagem = new MockGarage(spots, pairs);

        // Criar todos os apartamentos (101-704)
        apartamentos = [];
        for (let andar = 1; andar <= 7; andar++) {
            for (let unidade = 1; unidade <= 4; unidade++) {
                const numero = parseInt(`${andar}0${unidade}`);
                const isDuplo = APARTAMENTOS_DUPLOS.includes(numero);
                apartamentos.push(new MockApartment(numero, numero.toString(), true, isDuplo));
            }
        }
    });

    // ==================== TESTES DE CONFIGURAÇÃO ====================

    test('🏗️ Configuração inicial está correta', () => {
        expect(garagem.spots.length).toBe(42);
        expect(Object.keys(garagem.pairs).length).toBe(PARES_VALIDOS.length);
        expect(apartamentos.length).toBe(28);
        expect(apartamentos.filter(apt => apt.dupla).length).toBe(14);

        console.log(`📊 Pares configurados: ${Object.keys(garagem.pairs).length}`);
        console.log(`📊 Apartamentos duplos: ${apartamentos.filter(apt => apt.dupla).length}`);
    });

    test('📊 Matemática das vagas está correta', () => {
        const totalVagas = 42;
        const paresDisponiveis = PARES_VALIDOS.length; // 18 pares agora
        const vagasEmPares = paresDisponiveis * 2; // 36 vagas
        const vagasEstendidas = 6;
        const vagasSimples = totalVagas - vagasEmPares - vagasEstendidas; // 0 vagas

        expect(vagasEmPares + vagasEstendidas + vagasSimples).toBe(totalVagas);
        expect(vagasSimples).toBe(0);

        console.log(`📊 Pares disponíveis: ${paresDisponiveis}`);
        console.log(`📊 Vagas em pares: ${vagasEmPares}`);
        console.log(`📊 Vagas estendidas: ${vagasEstendidas}`);
        console.log(`📊 Vagas simples restantes: ${vagasSimples}`);
    });

    test('🔸 Vagas estendidas estão configuradas corretamente', () => {
        expect(VAGAS_ESTENDIDAS).toEqual([7, 8, 21, 22, 35, 36]);
        expect(VAGAS_ESTENDIDAS.length).toBe(6);

        // Verificar que todas existem na garagem
        for (const vagaId of VAGAS_ESTENDIDAS) {
            const vagaExiste = garagem.spots.some(spot => spot.id === vagaId);
            expect(vagaExiste).toBe(true);
        }
    });

    test('🚫 Nenhuma vaga estendida faz parte de par duplo', () => {
        const paresReais = Object.values(garagem.pairs);

        for (const pair of paresReais) {
            expect(VAGAS_ESTENDIDAS.includes(pair.aId)).toBe(false);
            expect(VAGAS_ESTENDIDAS.includes(pair.bId)).toBe(false);
        }
    });

    test('👥 Apartamentos estão categorizados corretamente', () => {
        const duplos = apartamentos.filter(apt => apt.dupla);
        const estendidos = apartamentos.filter(apt => APARTAMENTOS_ESTENDIDOS.includes(apt.id));
        const simples = apartamentos.filter(apt => !apt.dupla && !APARTAMENTOS_ESTENDIDOS.includes(apt.id));

        expect(duplos.length).toBe(14);
        expect(estendidos.length).toBe(5);
        expect(simples.length).toBe(9);
        expect(duplos.length + estendidos.length + simples.length).toBe(28);
    });

    test('⚠️ Cenário crítico: Déficit de pares para apartamentos duplos', () => {
        const apartamentosDuplos = apartamentos.filter(apt => apt.dupla).length;
        const paresDisponiveis = Object.keys(garagem.pairs).length;

        expect(apartamentosDuplos).toBe(14);
        expect(paresDisponiveis).toBe(PARES_VALIDOS.length);

        if (apartamentosDuplos > paresDisponiveis) {
            console.warn(`⚠️ ATENÇÃO: ${apartamentosDuplos} apartamentos duplos vs ${paresDisponiveis} pares disponíveis`);
            console.warn(`⚠️ ${apartamentosDuplos - paresDisponiveis} apartamento(s) duplo(s) receberá(ão) vaga simples`);
        } else {
            console.log(`✅ Pares suficientes: ${paresDisponiveis} pares para ${apartamentosDuplos} apartamentos duplos`);
        }
    });

    // ==================== TESTE DE SIMULAÇÃO BÁSICA ====================

    test('🎲 Simulação básica de distribuição de vagas', () => {
        // Simular distribuição simples
        const resultado = {
            duplosComPar: [],
            duplosComSimples: [],
            estendidosComVagaEstendida: [],
            simplesComVagaSimples: [],
            vagasUsadas: []
        };

        // 1. Atribuir pares aos apartamentos duplos (todos podem receber)
        const apartamentosDuplos = apartamentos.filter(apt => apt.dupla);
        const paresDisponiveis = Object.values(garagem.pairs);

        for (let i = 0; i < apartamentosDuplos.length; i++) {
            const apt = apartamentosDuplos[i];
            const par = paresDisponiveis[i]; // Todos os duplos podem receber par

            resultado.duplosComPar.push({
                apartamento: apt.id,
                vagas: [par.aId, par.bId]
            });
            resultado.vagasUsadas.push(par.aId, par.bId);
        }

        // 2. Como temos pares suficientes, nenhum apartamento duplo fica sem par
        // (removendo a lógica de apartamento duplo sem par)

        // 3. Atribuir vagas estendidas aos apartamentos estendidos
        for (let i = 0; i < APARTAMENTOS_ESTENDIDOS.length; i++) {
            resultado.estendidosComVagaEstendida.push({
                apartamento: APARTAMENTOS_ESTENDIDOS[i],
                vagas: [VAGAS_ESTENDIDAS[i]]
            });
            resultado.vagasUsadas.push(VAGAS_ESTENDIDAS[i]);
        }

        // 4. Apartamentos simples - como não há vagas simples restantes, 
        // eles ficarão sem vaga nesta simulação (cenário crítico)
        // Neste cenário, não há vagas simples suficientes!
        // Todos os apartamentos simples ficam sem vaga

        // ========== VALIDAÇÕES DA SIMULAÇÃO ==========

        const apartamentosSimples = apartamentos.filter(apt =>
            !apt.dupla && !APARTAMENTOS_ESTENDIDOS.includes(apt.id)
        );

        // Validar quantidades
        expect(resultado.duplosComPar.length).toBe(14); // Todos os duplos recebem par
        expect(resultado.duplosComSimples.length).toBe(0); // Nenhum duplo fica sem par
        expect(resultado.estendidosComVagaEstendida.length).toBe(5);
        expect(resultado.simplesComVagaSimples.length).toBe(0); // Nenhuma vaga simples restante!

        // Validar total de apartamentos atendidos
        const totalApartamentosAtendidos =
            resultado.duplosComPar.length +
            resultado.duplosComSimples.length +
            resultado.estendidosComVagaEstendida.length +
            resultado.simplesComVagaSimples.length;

        expect(totalApartamentosAtendidos).toBe(19); // Apenas 19 dos 28 apartamentos atendidos!

        // Validar total de vagas usadas
        const totalVagasUsadas =
            (resultado.duplosComPar.length * 2) +      // 14 * 2 = 28
            (resultado.duplosComSimples.length * 1) +   // 0 * 1 = 0 
            (resultado.estendidosComVagaEstendida.length * 1) + // 5 * 1 = 5
            (resultado.simplesComVagaSimples.length * 1);       // 0 * 1 = 0
        // Total: 28 + 0 + 5 + 0 = 33 vagas

        expect(resultado.vagasUsadas.length).toBe(totalVagasUsadas);

        console.log(`📊 Vagas realmente usadas: ${resultado.vagasUsadas.length}`);
        console.log(`📊 Cálculo esperado: ${totalVagasUsadas}`);

        // Validar que não há vagas duplicadas
        const vagasUnicas = [...new Set(resultado.vagasUsadas)];
        expect(vagasUnicas.length).toBe(resultado.vagasUsadas.length);

        // Log do resultado
        console.log('📊 RESULTADO DA SIMULAÇÃO:');
        console.log(`✅ Apartamentos duplos com par: ${resultado.duplosComPar.length}`);
        console.log(`✅ Apartamentos duplos com vaga simples: ${resultado.duplosComSimples.length}`);
        console.log(`✅ Apartamentos estendidos atendidos: ${resultado.estendidosComVagaEstendida.length}`);
        console.log(`⚠️ Apartamentos simples atendidos: ${resultado.simplesComVagaSimples.length}`);
        console.log(`⚠️ Apartamentos simples SEM vaga: ${apartamentosSimples.length}`);
        console.log(`📊 Total de apartamentos atendidos: ${totalApartamentosAtendidos}/28`);
        console.log(`📊 Total de vagas utilizadas: ${resultado.vagasUsadas.length}/42`);
        console.log(`📊 Vagas restantes: ${42 - resultado.vagasUsadas.length}`);

        // CONCLUSÃO: Este teste mostra que a configuração atual tem um problema:
        // - Muitos pares (18 pares = 36 vagas para duplos)
        // - Poucos apartamentos simples conseguem vaga (0 vagas simples restantes)
        console.warn('⚠️ PROBLEMA IDENTIFICADO: Configuração cria excesso de pares e déficit de vagas simples!');
    });
});

// ==================== TESTES DE VALIDAÇÃO DE REGRAS ====================

test('🔍 Pares válidos são fisicamente corretos', () => {
    for (const { ids, name } of PARES_VALIDOS) {
        // Verificar que são adjacentes (diferença de 1)
        expect(Math.abs(ids[1] - ids[0])).toBe(1);

        // Verificar que não usam vagas estendidas
        expect(VAGAS_ESTENDIDAS.includes(ids[0])).toBe(false);
        expect(VAGAS_ESTENDIDAS.includes(ids[1])).toBe(false);
    }
});

test('🚫 Pares proibidos não existem', () => {
    const paresProibidos = [
        [7, 8], [21, 22], [35, 36],  // Estendidas
        [22, 23], [36, 37],          // Transições impossíveis
    ];

    const paresReais = Object.values(garagem.pairs).map(p => [p.aId, p.bId]);

    for (const [a, b] of paresProibidos) {
        const existe = paresReais.some(([aReal, bReal]) =>
            (aReal === a && bReal === b) || (aReal === b && bReal === a)
        );
        expect(existe).toBe(false);
    }
});
});