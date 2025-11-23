/**
 * 🔍 VERIFICAÇÃO: Pares criados pelo sistema vs pares naturais oficiais
 */

// Simular criação de pares como no sistema atual
const FLOORS = ["G1", "G2", "G3"];
const SIDES_BY_FLOOR = { G1: ["A", "B"], G2: ["C", "D"], G3: ["E", "F"] };
const NATURAL_PAIRS = [[1, 2], [3, 4], [5, 6]];

function positionToSequentialNumber(floor, side, pos) {
    const floorBaseMap = { 'G1': 0, 'G2': 14, 'G3': 28 };
    const sideOffsetMap = { 'A': 0, 'B': 7, 'C': 0, 'D': 7, 'E': 0, 'F': 7 };

    return floorBaseMap[floor] + sideOffsetMap[side] + pos;
}

console.log('🔍 ===== VERIFICAÇÃO DE PARES =====\n');

// Gerar pares como o sistema atual faz
const pairsCreatedBySystem = [];
for (const floor of FLOORS) {
    for (const side of SIDES_BY_FLOOR[floor]) {
        for (const [p1, p2] of NATURAL_PAIRS) {
            const aId = positionToSequentialNumber(floor, side, p1);
            const bId = positionToSequentialNumber(floor, side, p2);

            pairsCreatedBySystem.push({
                id: `${floor}-${side}-${p1}-${p2}`,
                aId, bId,
                floor, side,
                positions: `${p1}-${p2}`
            });
        }
    }
}

console.log('📋 Pares criados pelo sistema atual:');
pairsCreatedBySystem.forEach((pair, index) => {
    console.log(`   ${index + 1}. ${pair.id}: vagas ${pair.aId}-${pair.bId} (pos ${pair.positions})`);
});

// Pares naturais oficiais da especificação
const paresNaturaisOficiais = [
    [1, 2], [3, 4], [5, 6],         // G1-A
    [9, 10], [11, 12], [13, 14],    // G1-B  
    [15, 16], [17, 18], [19, 20],   // G2-C
    [23, 24], [25, 26], [27, 28],   // G2-D
    [29, 30], [31, 32], [33, 34],   // G3-E
    [37, 38], [39, 40], [41, 42]    // G3-F
];

console.log(`\n📋 Pares naturais oficiais (da especificação):`);
paresNaturaisOficiais.forEach((pair, index) => {
    console.log(`   ${index + 1}. ${pair[0]}-${pair[1]}`);
});

// Comparar os dois
console.log(`\n🔍 Comparação:`);
console.log(`   Sistema atual cria: ${pairsCreatedBySystem.length} pares`);
console.log(`   Especificação define: ${paresNaturaisOficiais.length} pares`);

// Verificar se os pares do sistema coincidem com os oficiais
const pairsFromSystemAsNumbers = pairsCreatedBySystem.map(p => [p.aId, p.bId].sort((a, b) => a - b));
const officialPairsAsNumbers = paresNaturaisOficiais.map(p => [p[0], p[1]].sort((a, b) => a - b));

console.log(`\n📊 Análise de correspondência:`);

let matches = 0;
officialPairsAsNumbers.forEach((officialPair, index) => {
    const [a, b] = officialPair;
    const systemPair = pairsFromSystemAsNumbers.find(sp => sp[0] === a && sp[1] === b);

    if (systemPair) {
        console.log(`   ✅ ${a}-${b} (oficial) = encontrado no sistema`);
        matches++;
    } else {
        console.log(`   ❌ ${a}-${b} (oficial) = NÃO encontrado no sistema`);
    }
});

console.log(`\n🎯 Resultado:`);
if (matches === paresNaturaisOficiais.length) {
    console.log(`   ✅ PERFEITO: Todos os ${matches} pares oficiais estão no sistema`);
} else {
    console.log(`   ❌ PROBLEMA: Apenas ${matches}/${paresNaturaisOficiais.length} pares oficiais estão no sistema`);
    console.log(`   🔧 AÇÃO NECESSÁRIA: Ajustar criação de pares para seguir especificação oficial`);
}

// Identificar pares extras ou incorretos no sistema
console.log(`\n🔍 Pares do sistema que NÃO estão na especificação oficial:`);
pairsFromSystemAsNumbers.forEach(systemPair => {
    const [a, b] = systemPair;
    const isOfficial = officialPairsAsNumbers.find(op => op[0] === a && op[1] === b);

    if (!isOfficial) {
        console.log(`   ⚠️  ${a}-${b} (sistema) = NÃO está na lista oficial`);
    }
});

console.log('\n🔍 ===== FIM DA VERIFICAÇÃO =====');