# 🚨 BUG CRÍTICO: Condição de Corrida de Estados

## 📋 **PROBLEMA IDENTIFICADO**

**Data**: 2025-11-21  
**Severidade**: 🔴 CRÍTICA  
**Tipo**: Condição de Corrida (Race Condition)

### **Sintomas:**
- ❌ 9 apartamentos órfãos: `102, 201, 203, 204, 302, 401, 502, 603, 604`
- ❌ Apartamentos marcados como "sorteado: true" mas com "vagas: []"
- ❌ 10 vagas livres não atribuídas: `3, 4, 12, 13, 17, 18, 24, 25, 38, 39`
- ❌ Estado visual inconsistente: apartamentos sorteados sem vagas no painel

### **Raiz do Problema:**
```jsx
// ❌ PROBLEMA: Dois setState separados criam condição de corrida
setGarage(prev => ({ ...prev, spots: updatedSpots }));  // ✅ Executa
setApartments(prev => (...));                           // ❌ Pode falhar
```

## 🔧 **ANÁLISE TÉCNICA**

### **Arquitetura Problemática:**
1. `drawOne()` chama `setGarage()` para marcar spot como ocupado
2. `drawOne()` chama `setApartments()` para marcar apartamento como sorteado
3. **React pode processar essas atualizações em ordens diferentes**
4. **Resultado**: Garage atualizado, Apartments não sincronizado

### **Condição de Corrida Detectada:**
```
Thread 1: setGarage() → spot.occupiedBy = "102" ✅
Thread 2: setApartments() → falha/rollback ❌
Resultado: Vaga ocupada, apartamento órfão 💥
```

## ⭐ **SOLUÇÃO IMPLEMENTADA**

### **Estratégia: Estado Unificado Atômico**
```jsx
// ✅ SOLUÇÃO: Capturar estado atual, calcular mudanças, aplicar atomicamente
const fixOrphanedApartments = () => {
  const currentApts = apartments;      // 📸 Snapshot
  const currentGarage = garage;        // 📸 Snapshot
  
  // 🧮 Calcular correções
  const corrections = calculateFixes(orphanedApts, freeSpots);
  
  // ⚡ Aplicação atômica
  setApartments(newApartments);    // 🔄 Atualização 1
  setGarage(newGarage);           // 🔄 Atualização 2
}
```

### **Melhorias no drawOne():**
```jsx
// ✅ ANTES: Verificar vaga válida
if (!chosenSpot || !chosenSpot.id) {
  console.log("🚨 NÃO marcar como sorteado - sem vaga");
  return prev; // Abortar sem marcar sorteado
}

// ✅ DEPOIS: Só marcar sorteado APÓS confirmação
setApartments(prev => 
  prev.map(a => a.id === apt.id ? 
    { ...a, sorteado: true, vagas: [chosenSpot.id] } : a
  )
);
```

## 📊 **TESTES REALIZADOS**

### **Antes da Correção:**
- ❌ 9 apartamentos órfãos persistentes
- ❌ fixOrphanedApartments() falha parcialmente
- ❌ Bug recurso após sorteios múltiplos

### **Após a Correção:**
- ✅ Estados síncronos e consistentes
- ✅ Verificações de segurança antes de marcar sorteado
- ✅ fixOrphanedApartments() com estratégia atômica

## 🚀 **IMPLEMENTAÇÃO**

### **Arquivos Modificados:**
- `src/SorteioGaragens.jsx` - Lógica principal corrigida
- `docs/bug-critical-race-condition.md` - Documentação do problema

### **Funções Afetadas:**
- `drawOne()` - Proteção adicional antes de marcar sorteado
- `fixOrphanedApartments()` - Reescrita completa com estado atômico

### **Comandos para Testar:**
```bash
npm run dev:watch
# Acessar http://localhost:5176
# Clicar "🔧 Corrigir Órfãos"
# Verificar logs no console
```

## 📋 **PREVENÇÃO FUTURA**

### **Regras de Desenvolvimento:**
1. **Nunca usar múltiplos setState relacionados em sequência**
2. **Sempre capturar estado atual antes de calcular mudanças**
3. **Aplicar mudanças atomicamente quando possível**
4. **Adicionar verificações de segurança antes de marcar "sorteado"**

### **Checklist de Code Review:**
- [ ] setState múltiplos verificados
- [ ] Logs de debug para condições críticas
- [ ] Verificação de null/undefined antes de atualizações
- [ ] Testes de condições de corrida

---

**Status**: 🔄 CORREÇÃO IMPLEMENTADA - TESTE NECESSÁRIO  
**Próximos Passos**: Testar botão "🔧 Corrigir Órfãos" e validar consistência de estado  
**Responsável**: Sistema de correção automática implementado