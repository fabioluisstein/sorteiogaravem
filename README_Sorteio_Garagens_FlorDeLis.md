# README — Regras do Sorteio de Garagens (Edifício Flor de Lis)

## 0) Objetivo
Distribuir, de forma justa e auditável, vagas de garagem entre apartamentos, respeitando vagas **simples** e **duplas**, com **equilíbrio entre andares (G1, G2, G3)** e **lados (A/B)**, mantendo a experiência **visual** de:  
1) sortear **o apartamento**;  
2) **depois** sortear a(s) vaga(s) para ele;  
3) com um **pré-processamento aleatório e oculto** (apenas no console) para reservar **pares** destinados a quem precisa de **vaga dupla**, garantindo justiça e viabilidade.

---

## 1) Estrutura do Estacionamento
- **Andares:** G1, G2, G3.  
- **Vagas por andar:** 12 (6 por lado).  
- **Lados por andar:** A e B (cada lado possui posições 1…6).  
- **Pares naturais em cada lado:** (1–2), (3–4), (5–6).  
- **Vaga dupla:** sempre um **par natural contíguo do mesmo lado** (ex.: A3–A4).  
- **Vaga simples:** vaga única.

---

## 2) Entradas de Configuração (UI)
- **Lista de apartamentos** com um **toggle “Vaga dupla”** (por apartamento).
- **Mapa de vagas** (por andar/lado) com opção de marcar **vagas bloqueadas** (PCD, EV, visitantes etc.).
- **Controle de balanceamento:** ligado por padrão.  
- **Seed (opcional):** número para tornar o sorteio reprodutível.
- **Botões:**
  - **Sortear:** executa um ciclo de sorteio visual (apto → vaga).  
  - **Limpar:** limpa a **tela** (marcações visuais) e também **limpa a alocação/reserva interna** (reset total).

---

## 3) Comportamento dos Botões
### 3.1 Botão “Sortear”
1) **Se ainda não existir “reserva de pares para duplas” ativa**, o sistema:
   - Executa **uma única vez** um **pré-processamento aleatório oculto** (detalhes na seção 4):
     - **Reserva pares** para todos os apartamentos marcados como “vaga dupla”.  
     - Faz **balanceamento** G1/G2/G3 e A/B nessa reserva.  
     - **Loga no console** a ordem, as decisões, o estado do pool e a seed (se houver).
   - **Mantém essas reservas** em memória para as próximas rodadas de “Sortear”.
2) Em seguida, o sistema **sorteia visualmente um apartamento ainda não atendido**:
   - Mostra o **apto sorteado**.
   - Determina a(s) vaga(s) elegível(eis):
     - Se o apto for **vaga dupla** → usa o **par reservado previamente** (seção 4).  
     - Se for **vaga simples** → sorteia uma vaga livre elegível respeitando as regras (seção 5).
   - **Aloca e exibe** na UI (mapa + lista).  
   - **Remove** a(s) vaga(s) alocada(s) do pool visual e interno.

### 3.2 Botão “Limpar”
- **Reseta tudo**: limpa a **UI**, **desmarca** todos os apartamentos como sorteados, **apaga** reservas e alocações internas.  
- Após limpar, o próximo “Sortear” **refará** o pré-processamento das duplas (se houver duplas).

---

## 4) Pré-processamento oculto para Duplas
**Quando é feito:** automaticamente no **primeiro clique** em **Sortear** de uma sessão “limpa”.  
**Objetivo:** garantir que todos os apartamentos com **vaga dupla** tenham pares viáveis e **balanceados** entre andares/lados, **sem poluir** a experiência visual.

**Passos:**
1) **Coleta de pares livres** (excluindo bloqueadas) em todos os andares e lados.  
2) **Checagem de viabilidade:**  
   - Nº de apartamentos com **dupla** ≤ **pares livres totais**.  
   - Se não for viável, abortar (exibir alerta claro).
3) **Lista de duplas aleatória** (respeitando **seed**, se informada).  
4) **Balanceamento ao alocar pares**:  
   - Distribuir as duplas tentando manter contagem semelhante entre **G1/G2/G3** e entre **A/B**.  
5) **Reserva dos pares** (não exibida na UI):  
   - Para cada apto com dupla, **atribuir** um par específico e **marcar reservado** internamente.  
   - **Logar no console**: ordem dos aptos duplos, conjunto de pares elegíveis a cada passo, par escolhido, contadores por andar/lado.
6) **Persistência em memória**: as reservas ficam ativas e são consumidas **somente quando** o apto correspondente for sorteado visualmente.

---

## 5) Regras de Alocação (durante o sorteio visual)
5.1 **Invariantes**
- Vaga **dupla** = **par natural contíguo** (1–2, 3–4, 5–6) no **mesmo lado**, **mesmo andar**.  
- **Não cruzar** lados A/B nem misturar andares.  
- **Vagas bloqueadas** nunca entram no pool.

5.2 **Ordem visual**
- Sempre: **apto → vaga(s)**, um a um, por clique em **Sortear**.

5.3 **Duplas (no momento do apto)**
- Se o apto for dupla: **consumir** o **par reservado** previamente (seção 4).  
- **Falha rara** (ex.: par reservado acidentalmente usado):  
  - Recalcular par elegível naquele instante (com mesmos critérios de balanceamento).  
  - Logar aviso no console.

5.4 **Simples (no momento do apto)**
- Se o apto for simples:  
  - Candidatos = **todas as vagas livres não bloqueadas**.  
  - Se a política de proteção de pares **estiver ativa**, excluir vagas que **quebrem** um par **ainda necessário** para duplas pendentes.  
  - Caso contrário, apenas **não** usar vagas **reservadas** para duplas.

5.5 **Balanceamento (ativo por padrão)**
- Critério: priorizar regiões (andar/lado) **menos carregadas** no momento da escolha, sem “forçar” ambiguidades.  
- Empate → escolha aleatória (respeitando seed).  
- Se o balanceamento **impossibilitar** a alocação (faltou par/lado), relaxar **apenas para esse passo** e registrar no **console**.

5.6 **Proteção de pares (configurável)**
- **Default:** protege apenas os **pares reservados** no pré-processo.  
- **Alternativa:** enquanto houver duplas pendentes, **proteger todos os pares** para não quebrar pares naturais.

5.7 **Remoção do pool e registro**
- Após alocar, retirar a(s) vaga(s) do pool e **vincular** ao apto.  
- Atualizar **contadores** de balanceamento.  
- Registrar no **console** a decisão tomada.

---

## 6) Saídas e Visualizações
- **Mapa por andar:** G1, G2, G3 → **Lado A** (A1…A6) e **Lado B** (B1…B6).  
  - Cores: **Livre**, **Reservada (dupla)**, **Ocupada (simples)**, **Bloqueada**.  
  - Tooltip: mostra **apto** alocado (se houver).  
- **Lista de apartamentos:** status **Pendente / Sorteado**, vagas obtidas.  
- **Resumo (topo):** contadores, distribuição por andar/lado e seed.  
- **Console:** logs detalhados de pré-processo e sorteios.

---

## 7) Flags de Configuração
```
balancearDistribuicao = true
seed = <número ou null>
protegerTodosOsParesAteAtenderDuplas = false
permitirVagaSimplesEmParNaoReservado = true
logConsoleDetalhado = true
```

---

## 8) Fluxo Geral
1) Se limpo → pré-processar duplas.  
2) Sortear apto → atribuir vaga conforme tipo.  
3) Atualizar UI + logs.  
4) Repetir até todos os aptos.  
5) Limpar → reset total.

---

## 9) Padrões de Justiça
- Aleatoriedade visível no **nível do apto**.  
- Duplas garantidas via reserva oculta.  
- Equilíbrio entre andares/lados.  
- Reprodutibilidade via seed e logs detalhados.
