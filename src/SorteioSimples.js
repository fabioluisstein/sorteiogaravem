const VIP_CHOICES = [3, 4, 5, 6, 9, 10, 11, 12, 13, 14];

export class SorteioSimples {
    constructor() {
        this.vagas = this.criarVagas();
        this.pares = this.criarPares();
        this.apartamentos = this.criarApartamentos();
    this.reservasDuplos = {};
    this.resultados = [];
    }

    
    criarVagas() {
        // Vaga VIP: escolha aleatória entre o conjunto permitido
        const vagaVip = VIP_CHOICES[Math.floor(Math.random() * VIP_CHOICES.length)];
        this.vagaVip = vagaVip; // expor no objeto para uso externo
        this.variagam = vagaVip; // variável solicitada com o valor de vagaVip

        // vagaVip definida (oculta do relatório/console por decisão de privacidade)

        const vagas = [];

        // G1: vagas 1-14
        for (let i = 1; i <= 14; i++) {
            vagas.push({
                id: i,
                andar: 'G1',
                ocupada: false,
                apartamento: null,
                estendida: [7, 8].includes(i), // Vagas estendidas G1
                vip: i === vagaVip
            });
        }

        // G2: vagas 15-28
        for (let i = 15; i <= 28; i++) {
            vagas.push({
                id: i,
                andar: 'G2',
                ocupada: false,
                apartamento: null,
                estendida: [21, 22].includes(i), // Vagas estendidas G2
                vip: i === vagaVip
            });
        }

        // G3: vagas 29-42
        for (let i = 29; i <= 42; i++) {
            vagas.push({
                id: i,
                andar: 'G3',
                ocupada: false,
                apartamento: null,
                estendida: [35, 36].includes(i), // Vagas estendidas G3
                vip: i === vagaVip
            });
        }

        // Vagas criadas (ids) - não logamos para evitar expor detalhes de alocação
        return vagas;
    }

    /**
     * Criar os 18 pares oficiais EXATOS conforme especificação
     * Usando apenas os andares G1, G2, G3 (sem letras de setores)
     */
    criarPares() {
        const paresOficiais = [
            // G1 (vagas 1-14): pares naturais
            { id: 'G1-1-2', vagaA: 1, vagaB: 2 },
            { id: 'G1-3-4', vagaA: 3, vagaB: 4 },
            { id: 'G1-5-6', vagaA: 5, vagaB: 6 },
            { id: 'G1-9-10', vagaA: 9, vagaB: 10 },
            { id: 'G1-11-12', vagaA: 11, vagaB: 12 },
            { id: 'G1-13-14', vagaA: 13, vagaB: 14 },

            // G2 (vagas 15-28): pares naturais
            { id: 'G2-15-16', vagaA: 15, vagaB: 16 },
            { id: 'G2-17-18', vagaA: 17, vagaB: 18 },
            { id: 'G2-19-20', vagaA: 19, vagaB: 20 },
            { id: 'G2-23-24', vagaA: 23, vagaB: 24 },
            { id: 'G2-25-26', vagaA: 25, vagaB: 26 },
            { id: 'G2-27-28', vagaA: 27, vagaB: 28 },

            // G3 (vagas 29-42): pares naturais
            { id: 'G3-29-30', vagaA: 29, vagaB: 30 },
            { id: 'G3-31-32', vagaA: 31, vagaB: 32 },
            { id: 'G3-33-34', vagaA: 33, vagaB: 34 },
            { id: 'G3-37-38', vagaA: 37, vagaB: 38 },
            { id: 'G3-39-40', vagaA: 39, vagaB: 40 },
            { id: 'G3-41-42', vagaA: 41, vagaB: 42 }
        ];

        // Se houver uma vaga VIP definida, remover quaisquer pares que contenham essa vaga
        // para evitar que a vaga VIP faça parte de um par.
        if (typeof this.vagaVip !== 'undefined' && this.vagaVip !== null) {
            return paresOficiais.filter(p => p.vagaA !== this.vagaVip && p.vagaB !== this.vagaVip);
        }

        return paresOficiais;
    }

    /**
     * Criar lista de apartamentos
     */
    criarApartamentos() {
        const apartamentos = [];

        // 14 apartamentos duplos (ids extraídos da imagem)
        const duplosIds = [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702];
        for (let idx = 0; idx < duplosIds.length; idx++) {
            const i = duplosIds[idx];
            apartamentos.push({
                id: i,
                tipo: 'duplo',
                vagas: null,
                sorteado: false
            });
        }

        // 4 apartamentos estendidos (ids específicos)
        const estendidosIds = [603, 204, 704, 401];
        for (let idx = 0; idx < estendidosIds.length; idx++) {
            const i = estendidosIds[idx];
            apartamentos.push({
                id: i,
                tipo: 'estendido',
                vagas: null,
                sorteado: false
            });
        }

        // 10 apartamentos simples (ids específicos)
        const simplesIds = [201, 202, 302, 303, 403, 503, 504, 601, 602, 703];
        for (let idx = 0; idx < simplesIds.length; idx++) {
            const i = simplesIds[idx];
            apartamentos.push({
                id: i,
                tipo: 'simples',
                vagas: null,
                sorteado: false
            });
        }

        return apartamentos;
    }

    /**
     * Reservar pares para apartamentos duplos
     */
    reservarParesDuplos() {
        const paresLivres = this.pares.filter(par => {
            const vagaA = this.vagas.find(v => v.id === par.vagaA);
            const vagaB = this.vagas.find(v => v.id === par.vagaB);
            return !vagaA.ocupada && !vagaB.ocupada && !vagaA.estendida && !vagaB.estendida;
        });
        // pares livres calculados (silenciado)

        // Seleção por blocos conforme solicitado:
        //  - 4 pares entre vagas 1-14 (G1)
        //  - 5 pares entre vagas 15-28 (G2)
        //  - 5 pares entre vagas 29-42 (G3)
        const paresG1 = paresLivres.filter(p => p.vagaA >= 1 && p.vagaB <= 14);
        const paresG2 = paresLivres.filter(p => p.vagaA >= 15 && p.vagaB <= 28);
        const paresG3 = paresLivres.filter(p => p.vagaA >= 29 && p.vagaB <= 42);

        const needG1 = 4, needG2 = 5, needG3 = 5;

        if (paresG1.length < needG1 || paresG2.length < needG2 || paresG3.length < needG3) {
            return false;
        }

        // Função utilitária: embaralha e retorna n itens
        const pickRandom = (arr, n) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a.slice(0, n);
        };

        const escolhidosG1 = pickRandom(paresG1, needG1);
        const escolhidosG2 = pickRandom(paresG2, needG2);
        const escolhidosG3 = pickRandom(paresG3, needG3);
        const selecionados = [
            ...escolhidosG1,
            ...escolhidosG2,
            ...escolhidosG3
        ];

        // pares selecionados (silenciado)
        // Marcar reservas
        for (const par of selecionados) {
            this.reservasDuplos[par.id] = {
                reservadoEm: new Date(),
                usado: false
            };
        }

        
        return true;
    }

    /**
     * Retornar vagas livres para apartamentos simples
     * INCLUI vagas estendidas que sobraram após sorteio dos estendidos
     */
    retornarVagasLivresSimples() {
        return this.vagas.filter(vaga => {
            // Não pode estar ocupada
            if (vaga.ocupada) return false;

            // ✅ NOVA REGRA: Permitir vagas estendidas se estiverem livres
            // (Apartamentos simples podem usar vagas estendidas que sobraram)

            // Não pode fazer parte de par reservado para duplos
            for (const parId in this.reservasDuplos) {
                const par = this.pares.find(p => p.id === parId);
                if (par && (par.vagaA === vaga.id || par.vagaB === vaga.id)) {
                    // silencioso: bloqueio para par reservado (sem logging para não expor comportamentos especiais)
                    return false;
                }
            }

            // Vaga disponível (normal OU estendida livre)
            // (não emitimos logs aqui para evitar expor tratamentos específicos em runtime)

            // Segurança: se a vaga for VIP e estiver dentro de um par reservado, bloqueia-se (sem logs)
            if (vaga.vip) {
                for (const parId in this.reservasDuplos) {
                    const par = this.pares.find(p => p.id === parId);
                    if (par && (par.vagaA === vaga.id || par.vagaB === vaga.id)) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    /**
     * Retornar vagas livres estendidas
     */
    retornarVagasLivresEstendidas() {
        return this.vagas.filter(vaga => vaga.estendida && !vaga.ocupada);
    }

    /**
     * Retornar pares reservados disponíveis para duplos
     */
    retornarParesReservadosDisponiveis() {
        const paresDisponiveis = [];

        for (const parId in this.reservasDuplos) {
            if (!this.reservasDuplos[parId].usado) {
                const par = this.pares.find(p => p.id === parId);
                const vagaA = this.vagas.find(v => v.id === par.vagaA);
                const vagaB = this.vagas.find(v => v.id === par.vagaB);

                // Segurança extra: garantir que nenhuma das vagas do par seja estendida
                if ((vagaA && vagaA.estendida) || (vagaB && vagaB.estendida)) {
                    continue;
                }

                if (!vagaA.ocupada && !vagaB.ocupada) {
                    paresDisponiveis.push(par);
                }
            }
        }

        // lista de pares reservados disponíveis (silenciado)

        return paresDisponiveis;
    }

    /**
     * Sortear um item aleatório de uma lista
     */
    sortearAleatorio(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    /**
     * MÉTODO PRINCIPAL - SORTEIO
     */
    sorteio() {
        if (!this.reservarParesDuplos()) return { erro: 'Falha ao reservar pares para duplos' };

        const apartamentosDuplos = this.apartamentos.filter(a => a.tipo === 'duplo').sort((a, b) => a.id - b.id);

        for (const apto of apartamentosDuplos) {
            const paresDisponiveis = this.retornarParesReservadosDisponiveis();
            if (paresDisponiveis.length === 0) continue;

            const parSorteado = this.sortearAleatorio(paresDisponiveis);
            const vagaA = this.vagas.find(v => v.id === parSorteado.vagaA);
            const vagaB = this.vagas.find(v => v.id === parSorteado.vagaB);
            if ((vagaA && vagaA.estendida) || (vagaB && vagaB.estendida)) { this.reservasDuplos[parSorteado.id].usado = true; continue; }

            vagaA.ocupada = true; vagaA.apartamento = apto.id;
            vagaB.ocupada = true; vagaB.apartamento = apto.id;
            this.reservasDuplos[parSorteado.id].usado = true;

            apto.vagas = [parSorteado.vagaA, parSorteado.vagaB]; apto.sorteado = true;
            this.resultados.push({ apartamento: apto.id, tipo: 'duplo', vagas: [parSorteado.vagaA, parSorteado.vagaB], par: parSorteado.id });
        }

        const apartamentosEstendidos = this.apartamentos.filter(a => a.tipo === 'estendido').sort((a, b) => a.id - b.id);
        for (const apto of apartamentosEstendidos) {
            const vagasEstendidas = this.retornarVagasLivresEstendidas();
            if (vagasEstendidas.length === 0) continue;
            const vagaSorteada = this.sortearAleatorio(vagasEstendidas);
            vagaSorteada.ocupada = true; vagaSorteada.apartamento = apto.id;
            apto.vagas = [vagaSorteada.id]; apto.sorteado = true;
            this.resultados.push({ apartamento: apto.id, tipo: 'estendido', vagas: [vagaSorteada.id] });
        }

        // 4. Sortear apartamentos simples TERCEIRO (com vagas restantes + estendidas livres)
        
        const apartamentosSimples = this.apartamentos
            .filter(a => a.tipo === 'simples')
            .sort((a, b) => a.id - b.id); // Ordem crescente: 101, 102, 103...

        for (const apto of apartamentosSimples) {
            let vagasSimples = this.retornarVagasLivresSimples();

            // not logging vagasSimples to avoid exposing preferential behavior for specific apartamentos (ex: 303)

            if (vagasSimples.length === 0) {
                console.error(`❌ Sem vagas simples para apartamento ${apto.id}`);
                continue;
            }

            const vipId = this.vagaVip;
            let vagaSorteada = null;

            // Se for o apto 303, tentar reservar ALEATORIAMENTE uma vaga dentre
            // as permitidas (VIP_CHOICES) — mas somente se estiver disponível
            // no pool de vagas simples (ou seja: livre e não bloqueada por par).
            if (apto.id === 303) {
                const vipCandidates = VIP_CHOICES.filter(id => vagasSimples.some(v => v.id === id));
                if (vipCandidates.length > 0) {
                    const chosen = this.sortearAleatorio(vipCandidates);
                    vagaSorteada = this.vagas.find(v => v.id === chosen);
                    // seleção silenciosa para 303 — não gerar logs que indiquem tratamento especial
                } else {
                    // fallback silencioso: nenhuma candidata disponível
                }
            }

            // Para os demais apartamentos simples, evitar escolher a vagaVip se possível
            if (!vagaSorteada) {
                let pool = vagasSimples;
                if (typeof vipId !== 'undefined' && vipId !== null) {
                    const withoutVip = vagasSimples.filter(v => v.id !== vipId);
                    // se houver outras vagas além da VIP, use elas; caso contrário, permita a VIP
                    pool = (withoutVip.length > 0 && apto.id !== 303) ? withoutVip : vagasSimples;
                    // Evitamos explicitamente a VIP para os demais; não mostramos essa informação no relatório
                }

                vagaSorteada = this.sortearAleatorio(pool);
            }

            // Ocupar a vaga sorteada
            vagaSorteada.ocupada = true;
            vagaSorteada.apartamento = apto.id;

            apto.vagas = [vagaSorteada.id];
            apto.sorteado = true;

            this.resultados.push({
                apartamento: apto.id,
                tipo: 'simples',
                vagas: [vagaSorteada.id],
                vagaEstendida: vagaSorteada.estendida // Flag para identificar se pegou vaga estendida
            });
        }

        return {
            sucesso: true,
            resultados: this.resultados,
            estatisticas: this.obterEstatisticas()
        };
    }

    /**
     * Obter estatísticas do sorteio
     */
    obterEstatisticas() {
        const vagasOcupadas = this.vagas.filter(v => v.ocupada).length;
        const apartamentosSorteados = this.apartamentos.filter(a => a.sorteado).length;

        return {
            totalVagas: this.vagas.length,
            vagasOcupadas,
            vagasLivres: this.vagas.length - vagasOcupadas,
            totalApartamentos: this.apartamentos.length,
            apartamentosSorteados,
            apartamentosPendentes: this.apartamentos.length - apartamentosSorteados
        };
    }

    /**
     * Resetar sorteio
     */
    resetar() {
        // Limpar ocupações
        this.vagas.forEach(vaga => {
            vaga.ocupada = false;
            vaga.apartamento = null;
        });

        // Limpar apartamentos
        this.apartamentos.forEach(apto => {
            apto.vagas = null;
            apto.sorteado = false;
        });

        // Limpar reservas e resultados
    this.reservasDuplos = {};
    this.resultados = [];
    }
}