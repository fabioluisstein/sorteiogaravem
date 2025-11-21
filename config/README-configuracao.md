# Como Configurar o Sorteio usando o arquivo .properties

## 📁 Localização
O arquivo de configuração está em: `config/sorteio.properties`

## 🔧 Como Editar as Configurações

### 1. **Vagas por Andar**
```properties
# Defina os números das vagas para cada andar
vagas_g1=1,2,3,4,5,6,7,8,9,10,11,12,13,14
vagas_g2=15,16,17,18,19,20,21,22,23,24,25,26,27,28
vagas_g3=29,30,31,32,33,34,35,36,37,38,39,40,41,42
```

### 2. **Vagas Extendidas**
```properties
# Defina quais vagas são especiais (apenas apartamentos específicos podem usar)
vagas_extendidas=35,36

# Exemplo: Para tornar as vagas 7, 14 e 21 extendidas:
# vagas_extendidas=7,14,21
```

### 3. **Apartamentos com Vaga Dupla**
```properties
# Apartamentos que precisam de 2 vagas adjacentes
apartamentos_vagas_duplas=103,105,107,109,110,111,112,201,202,203

# Exemplo: Para adicionar o apartamento 301:
# apartamentos_vagas_duplas=103,105,107,109,110,111,112,201,202,203,301
```

### 4. **Apartamentos com Direito a Vagas Extendidas**
```properties
# Apartamentos que podem participar do sorteio das vagas extendidas
apartamentos_vagas_extendidas=101,103,105,201,203

# Exemplo: Para permitir que o apartamento 401 concorra:
# apartamentos_vagas_extendidas=101,103,105,201,203,401
```

## 📋 Exemplos de Configuração

### Cenário 1: Vagas 7 e 14 são extendidas
```properties
vagas_extendidas=7,14
apartamentos_vagas_extendidas=101,201,301
```

### Cenário 2: Apenas vaga 42 é extendida
```properties
vagas_extendidas=42
apartamentos_vagas_extendidas=404,504
```

### Cenário 3: Sem vagas extendidas
```properties
vagas_extendidas=
apartamentos_vagas_extendidas=
```

## ⚙️ Regras de Configuração

### ✅ **Formato Correto:**
- **Números:** `vagas_extendidas=35,36,42`
- **Sem espaços extras:** `apartamentos_vagas_duplas=101,102,103`
- **Comentários com #:** `# Este é um comentário`

### ❌ **Evite:**
- **Espaços:** `vagas_extendidas= 35, 36 , 42`
- **Vírgula no final:** `vagas_extendidas=35,36,`
- **Números inválidos:** `vagas_extendidas=0,50,100`

## 🔄 Como Aplicar as Mudanças

1. **Edite** o arquivo `config/sorteio.properties`
2. **Salve** as alterações
3. **Recarregue** a página no navegador
4. **Teste** o sorteio com as novas configurações

## 🎯 Exemplos Práticos

### **Exemplo 1: Edifício Pequeno (21 vagas)**
```properties
vagas_g1=1,2,3,4,5,6,7
vagas_g2=8,9,10,11,12,13,14
vagas_g3=15,16,17,18,19,20,21
vagas_extendidas=7,14,21
total_vagas=21
```

### **Exemplo 2: Edifício Grande (60 vagas)**
```properties
vagas_g1=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20
vagas_g2=21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40
vagas_g3=41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60
vagas_extendidas=20,40,60
total_vagas=60
```

## 🚨 Observações Importantes

1. **Apartamentos com vaga dupla** sempre precisam de 2 vagas adjacentes
2. **Vagas extendidas** são sempre individuais (não podem ser duplas)
3. **Numeração** deve ser sequencial e sem repetições
4. **Se sobrar vaga extendida**, ela entra no sorteio normal no final

## 📞 Suporte
Se tiver dúvidas sobre a configuração, consulte a documentação técnica em `docs/configuracao-vagas.md`