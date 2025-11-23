/**
 * 🔍 ANÁLISE: Pares naturais oficiais vs implementação atual
 */

console.log('🔍 ===== ANÁLISE DOS PARES NATURAIS =====\n');

// Pares naturais oficiais conforme especificação
const paresNaturaisOficiais = [
    [1, 2], [3, 4], [5, 6],         // G1-A
    [9, 10], [11, 12], [13, 14],    // G1-B  
    [15, 16], [17, 18], [19, 20],   // G2-C
    [23, 24], [25, 26], [27, 28],   // G2-D
    [29, 30], [31, 32], [33, 34],   // G3-E
    [37, 38], [39, 40], [41, 42]    // G3-F
];

// Vagas proibidas oficiais
const vagasProibidas = [7, 8, 21, 22, 35, 36];

console.log('📋 Pares naturais oficiais:');
paresNaturaisOficiais.forEach((par, index) => {
    const [a, b] = par;
    const temProibida = vagasProibidas.includes(a) || vagasProibidas.includes(b);
    console.log(`   ${index + 1}. ${a}-${b} ${temProibida ? '❌ (contém proibida)' : '✅'}`);
});

console.log(`\n📊 Resumo:`);
console.log(`   Total de pares oficiais: ${paresNaturaisOficiais.length}`);

const paresValidos = paresNaturaisOficiais.filter(par => {
    const [a, b] = par;
    return !vagasProibidas.includes(a) && !vagasProibidas.includes(b);
});

console.log(`   Pares válidos (sem proibidas): ${paresValidos.length}`);
console.log(`   Apartamentos duplos necessários: 14`);

if (paresValidos.length >= 14) {
    console.log(`   ✅ SUFICIENTE: ${paresValidos.length} ≥ 14`);
} else {
    console.log(`   ❌ INSUFICIENTE: ${paresValidos.length} < 14`);
}

console.log(`\n🚫 Pares com vagas proibidas:`);
paresNaturaisOficiais.forEach(par => {
    const [a, b] = par;
    const temProibida = vagasProibidas.includes(a) || vagasProibidas.includes(b);
    if (temProibida) {
        console.log(`   ${a}-${b} (vaga proibida: ${vagasProibidas.includes(a) ? a : b})`);
    }
});

console.log('\n🔍 ===== FIM DA ANÁLISE =====');