/**
 * 🔍 ANÁLISE ESPECÍFICA: Por que o par G3-F-5-6 não está disponível?
 */

// Simulação das vagas do par G3-F-5-6
function positionToSequentialNumber(floor, side, pos) {
    const floorMap = { 'G1': 0, 'G2': 1, 'G3': 2 };
    const sideMap = { 'A': 0, 'B': 1, 'C': 0, 'D': 1, 'E': 0, 'F': 1 };

    const base = floorMap[floor] * 14 + sideMap[side] * 7;
    return base + pos;
}

console.log('🔍 ===== ANÁLISE DO PAR G3-F-5-6 =====\n');

// Calcular IDs das vagas do par G3-F-5-6
const vagaId5 = positionToSequentialNumber('G3', 'F', 5); // Posição 5
const vagaId6 = positionToSequentialNumber('G3', 'F', 6); // Posição 6

console.log(`Par G3-F-5-6:`);
console.log(`   Vaga A (posição 5): ID ${vagaId5}`);
console.log(`   Vaga B (posição 6): ID ${vagaId6}`);

// Verificar se estão nas vagas proibidas
const vagasProibidasDuplo = [7, 8, 21, 22, 35, 36];

console.log(`\n🚫 Verificação de vagas proibidas:`);
console.log(`   Vaga ${vagaId5} é proibida: ${vagasProibidasDuplo.includes(vagaId5)}`);
console.log(`   Vaga ${vagaId6} é proibida: ${vagasProibidasDuplo.includes(vagaId6)}`);

// Verificar se são vagas estendidas
const vagasEstendidas = [7, 8, 21, 22, 35, 36];

console.log(`\n🏢 Verificação de vagas estendidas:`);
console.log(`   Vaga ${vagaId5} é estendida: ${vagasEstendidas.includes(vagaId5)}`);
console.log(`   Vaga ${vagaId6} é estendida: ${vagasEstendidas.includes(vagaId6)}`);

// Análise das outras vagas que foram ocupadas
console.log(`\n📊 Status esperado:`);
console.log(`   Este par deveria estar LIVRE e DISPONÍVEL`);
console.log(`   Não contém vagas proibidas: ✅`);
console.log(`   Não contém vagas estendidas: ✅`);
console.log(`   É um par natural válido (5-6): ✅`);

console.log(`\n🎯 CONCLUSÃO:`);
console.log(`   O par G3-F-5-6 (${vagaId5}-${vagaId6}) deveria estar disponível!`);
console.log(`   Pode haver problema na lógica de liberação de vagas após ocupação.`);

// Verificar se as vagas foram ocupadas por apartamentos simples
console.log(`\n🔍 Hipóteses do problema:`);
console.log(`   1. Vagas ${vagaId5} ou ${vagaId6} foram ocupadas por apartamentos simples`);
console.log(`   2. Par não está sendo detectado como livre após ocupações`);
console.log(`   3. Sistema não está atualizando estado dos pares corretamente`);

console.log('\n🔍 ===== FIM DA ANÁLISE =====');