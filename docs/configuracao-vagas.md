# Configuração das Vagas - Sorteio Garagem

## Layout das Vagas (Numeração Sequencial 1-42)

### G1 (Vagas 1-14)
- **Lado A**: 1, 2, 3, 4, 5, 6, **7** (extendida)
- **Lado B**: 8, 9, 10, 11, 12, 13, **14** (extendida)

### G2 (Vagas 15-28)  
- **Lado C**: 15, 16, 17, 18, 19, 20, **21** (extendida)
- **Lado D**: 22, 23, 24, 25, 26, 27, **28** (extendida)

### G3 (Vagas 29-42)
- **Lado E**: 29, 30, 31, 32, 33, 34, **35** (extendida)
- **Lado F**: 36, 37, 38, 39, 40, 41, **42** (extendida)

## Pares Naturais para Duplas
- Pares: (1,2), (3,4), (5,6) por lado
- Vagas 7, 14, 21, 28, 35, 42 são **vagas extendidas** (não fazem par)

## Configuração de Apartamentos

### Apartamentos com Direito a Vagas Extendidas
- 101, 103, 105, 201, 203 (configurável no arquivo `vagasConfig.js`)

### Apartamentos com Direito a Vaga Dupla
- 103, 105, 107, 109, 110, 111, 112, 201, 202, 203 (configurável no arquivo `vagasConfig.js`)
- **Na interface:** Checkbox "Dupla" aparece:
  - ✅ **Habilitado e marcado** - para apartamentos com direito
  - ❌ **Desabilitado e cinza** - para apartamentos sem direito

## Regras de Sorteio
1. **Vagas normais (1-6 por lado)**: Todos os apartamentos podem concorrer
2. **Vagas extendidas (posição 7 de cada lado)**: Apenas apartamentos específicos podem concorrer
3. **Duplas**: Funcionam normalmente nos pares (1,2), (3,4), (5,6)
4. **Direito a dupla**: Configurado no arquivo, checkbox automaticamente setado na interface
5. **Apartamentos com direito a extendidas**: Podem concorrer tanto a vagas normais quanto extendidas

## Como Editar a Configuração
Edite o arquivo `src/config/vagasConfig.js`:
- `APARTAMENTOS_VAGAS_EXTENDIDAS`: Lista apartamentos que podem concorrer a vagas extendidas
- `APARTAMENTOS_VAGA_DUPLA`: Lista apartamentos com direito a vaga dupla