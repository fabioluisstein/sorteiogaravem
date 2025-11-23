## 🔒 Teste de Reserva Especial - Versão Simples

### Configuração Atual
```properties
apartamento_301_vaga=21
```

### O que deve acontecer:
1. **Quando apartamento 301 for sorteado**: 
   - ✅ Deve receber **imediatamente** a vaga 21
   - ✅ Não deve seguir lógica normal de sorteio (dupla/simples)
   - ✅ Logs no console: 
     - `🔒 Reserva especial: Apartamento 301 → Vaga 21`
     - `🔒 Apartamento 301 tem vaga reservada: 21`
     - `✅ Apartamento 301 recebeu vaga reservada 21`

2. **Para todos os outros apartamentos**:
   - ✅ Sorteio normal continua funcionando
   - ✅ Vaga 21 fica "ocupada" e não aparece nas opções

### Como testar:
1. Abrir http://localhost:5174/
2. Abrir Console do navegador (F12)
3. Clicar em "1 Sortear" repetidas vezes
4. Quando apartamento 301 for sorteado, observar os logs
5. Verificar se recebeu vaga 21

### Implementação:
- ✅ Configuração: `apartamento_301_vaga=21`
- ✅ Função: `getReservaEspecial(apartamentoId)`
- ✅ Verificação no `drawOne()` antes do sorteio normal
- ✅ Logs detalhados para debugging

**Status: PRONTO PARA TESTE** 🚀