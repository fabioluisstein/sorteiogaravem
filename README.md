# 🎲 Sistema de Sorteio de Garagens - Flor de Lis

Sistema simples e eficiente para sorteio de vagas de garagem do condomínio Flor de Lis.

## 🚀 Características Principais

- **Sistema Único**: Apenas o sorteio simples, sem complexidade desnecessária
- **18 Pares Oficiais**: Vagas que sempre ficam juntas para apartamentos duplos
- **6 Vagas Estendidas**: Vagas especiais para apartamentos duplos estendidos (7, 8, 21, 22, 35, 36)
- **Geração de PDF**: Impressão profissional dos resultados
- **Interface Limpa**: Fácil de usar e entender

## 🏗️ Estrutura

### 🏢 Distribuição
- **28 apartamentos** distribuídos em:
  - 14 apartamentos — vagas duplas (2 vagas cada)
  - 4 apartamentos — vagas duplas estendidas (1 vaga especial cada)  
  - 10 apartamentos — vaga simples (1 vaga normal cada)

### 🅿️ Vagas (Total: 42)
- **Andar G1**: Vagas 1-14
- **Andar G2**: Vagas 15-28  
- **Andar G3**: Vagas 29-42

### 🔗 Pares Oficiais (18 pares)
**G1**: (1,2), (3,4), (5,6), (9,10), (11,12), (13,14)  
**G2**: (15,16), (17,18), (19,20), (23,24), (25,26), (27,28)  
**G3**: (29,30), (31,32), (33,34), (37,38), (39,40), (41,42)

### 🔧 Vagas Estendidas
**7, 8, 21, 22, 35, 36** - Não formam pares, usadas individualmente

## 💻 Como Usar

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Execute o sistema**:
   ```bash
   npm run dev
   ```

3. **Acesse**: http://localhost:5173

4. **Execute o sorteio** clicando no botão principal

5. **Gere PDF** dos resultados para documentação oficial

## 📊 Funcionalidades

### ✅ Sorteio Automático
- Distribui automaticamente os apartamentos
- Respeita os pares oficiais
- Usa vagas estendidas quando necessário

### 📄 Relatório PDF
- Layout profissional
- Organizado por categorias
- Pronto para impressão
- Com data e hora do sorteio

### 🎯 Validação
- Todos os 28 apartamentos são contemplados
- Todas as 42 vagas são utilizadas
- Apenas pares oficiais são formados

## 🛠️ Tecnologias

- **React** - Interface de usuário
- **Vite** - Build e desenvolvimento
- **JavaScript** - Lógica do sorteio
- **CSS** - Estilização

## 📋 Estrutura de Arquivos

```
src/
├── App.jsx                          # Aplicação principal
├── SorteioSimples.js               # Lógica do sorteio
├── components/
│   └── SorteioSimplesComponent.jsx # Interface React
├── assets/                         # Recursos estáticos
└── main.jsx                        # Ponto de entrada
```

## 🎉 Sistema Limpo e Simplificado

Este sistema foi otimizado para ser:
- **Fácil de entender**: Código simples e direto
- **Rápido de usar**: Interface intuitiva
- **Confiável**: Lógica testada e validada
- **Profissional**: Relatórios prontos para uso oficial

---

**Flor de Lis** | Sistema de Sorteio Simplificado ✨
