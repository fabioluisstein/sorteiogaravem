## 🔒 Teste de Reservas Especiais - Sistema de Sorteio

### Configuração de Teste
- **Apartamento**: 301
- **Vaga Reservada**: 21 (vaga estendida no G2)
- **Tipo de Apartamento**: Dupla (101,102,103,104,203,301,304,402,404,501,502,604,701,702)

### Expectativas do Sistema

#### 1. Carregamento da Configuração
- [✅] Sistema deve carregar reserva especial "301=21" do arquivo
- [✅] Logs devem mostrar: "🔒 [RESERVA ESPECIAL] Apt 301 → Vaga 21 (prioridade absoluta)"

#### 2. Proteção de Pares (Duplas)
- **Vaga 21 é par da Vaga 22**
- [✅] Vaga 22 deve ser bloqueada para duplas automaticamente
- [✅] Logs devem mostrar: "🚫 Vaga 22 bloqueada para duplas (par de reserva especial 21)"

#### 3. Durante o Sorteio
- **Quando apartamento 301 for sorteado:**
  - [✅] Deve receber IMEDIATAMENTE a vaga 21 (ignorando lógica de duplas)
  - [✅] Não deve tentar buscar par de vagas
  - [✅] Logs devem mostrar: "✅ [RESERVA ESPECIAL] Apartamento 301 recebeu vaga reservada 21"

#### 4. Exclusões e Proteções
- **Para outros apartamentos duplas:**
  - [✅] Não podem usar vaga 22 (par de reserva especial)
  - [✅] Sistema deve excluir vaga 22 da lista de pares disponíveis
- **Para apartamentos simples:**
  - [✅] Não podem usar vaga 21 (reservada)
  - [✅] Sistema deve excluir vaga 21 da lista de vagas livres

### Passos de Teste
1. Abrir aplicação em http://localhost:5174/
2. Abrir Console do Navegador (F12)
3. Procurar logs de carregamento das reservas
4. Clicar em "1 Sortear" até apartamento 301 ser sorteado
5. Verificar se vaga 21 foi atribuída corretamente
6. Verificar se vaga 22 não aparece em pares disponíveis

### Verificações Adicionais
- ⚠️ **Conflito de Tipos**: Apartamento 301 tem direito a duplas, mas reserva especial é para vaga única
- 🔍 **Comportamento Esperado**: Reserva especial tem prioridade absoluta, então 301 recebe vaga 21 (única)
- 📝 **Logs Importantes**: Procurar por emojis 🔒, 🚫, ✅ nos logs do console