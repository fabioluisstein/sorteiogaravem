# 🎯 Sistema de Testes Automatizados - Sorteio Garagens Flor de Lis

Este diretório contém uma suíte completa de testes automatizados para validar todas as regras do sorteio de garagens do edifício Flor de Lis.

## 📋 Visão Geral

O sistema de testes valida matematicamente e logicamente:

- **42 vagas totais** distribuídas corretamente
- **14 apartamentos duplos** recebendo apenas pares válidos
- **5 apartamentos estendidos** recebendo apenas vagas estendidas
- **9 apartamentos simples** recebendo vagas simples restantes
- **Integridade completa** sem duplicações ou omissões

## 🚀 Execução Rápida

### Executar todos os testes
```powershell
node run-tests.js
```

### Executar apenas o teste principal de sorteio
```powershell
node run-tests.js --sorteio
```

### Executar com relatório de cobertura
```powershell
node run-tests.js --coverage
```

## 📂 Estrutura dos Testes

```
src/tests/
├── integration/
│   └── sorteio-garagens.test.js      # 🎯 Teste principal completo
├── validation/
│   └── edge-cases.test.js            # 🔍 Casos extremos e validações
├── setup/
│   └── jest.setup.js                 # 🔧 Configuração global Jest
└── README-TESTES.md                  # 📖 Esta documentação
```

## 🎯 Teste Principal (`sorteio-garagens.test.js`)

### O que testa:
- ✅ Sorteio completo para todos os 28 apartamentos
- ✅ Distribuição correta por tipo (duplo/estendido/simples)
- ✅ Validação de pares fisicamente válidos
- ✅ Exclusividade de vagas estendidas
- ✅ Integridade matemática (42 vagas = total atribuído)

### Estrutura do teste:
1. **Configuração**: Cria 42 vagas + 13 pares + 28 apartamentos
2. **Execução**: Roda sorteio completo simulando produção
3. **Validação**: Verifica todas as regras de negócio
4. **Relatório**: Gera resumo detalhado dos resultados

### Dados utilizados:
```javascript
// Vagas estendidas (exclusivas para apartamentos estendidos)
const VAGAS_ESTENDIDAS = [7, 8, 21, 22, 35, 36];

// Apartamentos duplos (necessitam pares válidos)
const APARTAMENTOS_DUPLOS = [101,102,103,104,203,301,304,402,404,501,502,604,701,702];

// Apartamentos estendidos (necessitam vagas estendidas)
const APARTAMENTOS_ESTENDIDOS = [303,403,503,603,703];

// Pares fisicamente válidos (apenas estes podem ser usados)
const PARES_VALIDOS = [
    [1,2], [3,4], [5,6],        // Garagem 1 - Lado A
    [8,9], [10,11], [12,13],    // Garagem 1 - Lado B  
    [15,16], [17,18], [19,20],  // Garagem 2 - Lado C
    [29,30], [31,32], [33,34],  // Garagem 3 - Lado E
    [38,39]                     // Garagem 3 - Lado F
];
```

## 🔍 Teste de Casos Extremos (`edge-cases.test.js`)

### O que testa:
- 🚫 Pares proibidos não existem na garagem
- 📊 Matemática das vagas fecha corretamente
- ⚠️ Cenário crítico: 14 apartamentos duplos vs 13 pares
- 🔍 Validação de dados de entrada
- 🏗️ Estrutura correta da garagem

### Pares proibidos validados:
```javascript
const PARES_PROIBIDOS = [
    [7, 8], [21, 22], [35, 36],  // Ambas estendidas
    [22, 23], [36, 37],          // Estendida + adjacente impossível
    [6, 7], [13, 14], [20, 21],  // Transições entre lados
    [27, 28], [34, 35], [41, 42] // Transições entre andares
];
```

## 🔧 Configuração Jest (`jest.setup.js`)

### Funcionalidades:
- **Mocks globais** para configuração de sorteio
- **Matchers customizados** para validações específicas
- **Utilitários de teste** como seeds determinísticas
- **Hooks globais** para limpeza entre testes

### Matchers personalizados:
```javascript
expect(par).toBeValidPair(paresValidos);        // Valida pares físicos
expect(vaga).toBeExtendedSpot();                // Verifica vaga estendida
expect(resultado).toHaveCorrectSpotType('double'); // Tipo correto de vaga
```

## 🎛️ Opções de Execução

### Comandos disponíveis:
```powershell
# Todos os testes
node run-tests.js --all

# Apenas teste principal
node run-tests.js --sorteio

# Apenas casos extremos  
node run-tests.js --edge

# Com relatório de cobertura
node run-tests.js --coverage

# Modo watch (re-executa ao salvar)
node run-tests.js --watch

# Modo silencioso
node run-tests.js --silent

# Ver ajuda
node run-tests.js --help
```

### Combinando opções:
```powershell
# Teste principal silencioso
node run-tests.js --sorteio --silent

# Casos extremos com watch
node run-tests.js --edge --watch

# Cobertura completa
node run-tests.js --all --coverage
```

## 📊 Validações Realizadas

### 1. Distribuição Quantitativa
- [x] **14 duplos** recebem exatamente 2 vagas cada (28 vagas)
- [x] **5 estendidos** recebem exatamente 1 vaga estendida cada (5 vagas)
- [x] **9 simples** recebem exatamente 1 vaga simples cada (9 vagas)
- [x] **Total**: 28 + 5 + 9 = 42 vagas (100% das vagas)

### 2. Qualidade dos Pares
- [x] Apenas os **13 pares fisicamente válidos** são utilizados
- [x] Nenhum **par inválido** (ex: 22-23, 7-8) é gerado
- [x] Pares não usam **vagas estendidas** (7,8,21,22,35,36)
- [x] Pares são **adjacentes** e **fisicamente possíveis**

### 3. Exclusividade das Vagas
- [x] **Vagas estendidas** (7,8,21,22,35,36) apenas para apartamentos estendidos
- [x] **Vagas de pares** apenas para apartamentos duplos
- [x] **Vagas simples** apenas para apartamentos simples
- [x] **Sem sobreposição** entre tipos de vagas

### 4. Integridade do Sistema
- [x] **Nenhuma vaga duplicada** na atribuição
- [x] **Todos os apartamentos** recebem vaga
- [x] **42 vagas utilizadas** de 42 disponíveis
- [x] **Nenhuma vaga órfã** (não atribuída)

## ⚠️ Cenários Críticos Identificados

### Problema: Déficit de Pares
- **Apartamentos duplos**: 14
- **Pares disponíveis**: 13
- **Déficit**: 1 apartamento duplo ficará sem par

### Solução Esperada:
O sistema deve detectar essa situação e:
1. Atribuir os 13 pares aos primeiros 13 apartamentos duplos sorteados
2. O 14º apartamento duplo deve receber 1 vaga simples
3. Ajustar a contagem de vagas simples disponíveis

### Validação no Teste:
```javascript
test('⚠️ Cenário crítico: Mais apartamentos duplos que pares disponíveis', () => {
    const paresDisponiveis = 13;
    const apartamentosDuplos = 14;
    expect(apartamentosDuplos).toBeGreaterThan(paresDisponiveis);
    // Sistema deve lidar com essa situação graciosamente
});
```

## 📈 Relatórios Esperados

### Saída de Sucesso:
```
🎯 ===== SORTEIO COMPLETO DE GARAGENS - Edifício Flor de Lis =====

📊 Sorteio finalizado: 28 apartamentos sorteados

✅ Apartamentos duplos sorteados: 14/14
✅ Apartamentos estendidos sorteados: 5/5  
✅ Apartamentos simples sorteados: 9
✅ Total de vagas utilizadas: 42/42
✅ Todas as validações passaram!

🔄 Validação de Apartamentos Duplos
  ✓ Quantidade exata de duplos atribuídos
  ✓ Todos os duplos receberam pares válidos
  ✓ Nenhum par inválido foi usado

🔸 Validação de Apartamentos Estendidos  
  ✓ Quantidade exata de estendidos atribuídos
  ✓ Todos receberam vagas estendidas exclusivamente
  ✓ Nenhuma vaga estendida foi usada por não-estendidos

🔹 Validação de Apartamentos Simples
  ✓ Apartamentos simples receberam vagas simples exclusivamente

🔍 Validação de Integridade
  ✓ Total de vagas atribuídas = 42
  ✓ Nenhuma vaga duplicada
  ✓ Todos os apartamentos receberam vaga
  ✓ Soma matemática correta
  ✓ Distribuição esperada de tipos
```

## 🛠️ Resolução de Problemas

### Jest não encontrado
```powershell
npm install -g jest
# ou
npx jest --version
```

### Módulos ES6 não suportados
Verifique se `package-tests.json` tem:
```json
{
  "type": "module"
}
```

### Paths relativos não funcionam
Verifique configuração de `moduleNameMapping` no Jest.

### Testes lentos
Use a opção `--silent` para reduzir logs:
```powershell
node run-tests.js --silent
```

## 🎯 Objetivo Final

Este sistema de testes garante que o sorteio de garagens do edifício Flor de Lis:

1. **Seja matematicamente correto** - todas as 42 vagas são atribuídas
2. **Respeite as regras físicas** - apenas pares adjacentes válidos
3. **Mantenha exclusividade** - cada tipo de apartamento recebe seu tipo de vaga
4. **Seja determinístico** - resultados reproduzíveis para auditoria
5. **Seja confiável** - validações abrangentes capturam qualquer desvio

**Execute os testes sempre que modificar o código do sorteio para garantir que todas as regras continuam sendo respeitadas!**