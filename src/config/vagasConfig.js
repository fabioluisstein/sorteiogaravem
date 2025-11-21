// Configuração das vagas do sorteio
export const VAGAS_CONFIG = {
    // Configuração geral
    TOTAL_VAGAS: 42,
    VAGAS_POR_ANDAR: 14,
    VAGAS_POR_LADO: 7,

    // Andares e lados
    FLOORS: ["G1", "G2", "G3"],
    SIDES_BY_FLOOR: {
        G1: ["A", "B"],
        G2: ["C", "D"],
        G3: ["E", "F"]
    },

    // Posições por lado (1 a 7)
    POSITIONS: [1, 2, 3, 4, 5, 6, 7],

    // Pares naturais para duplas (posições 1-2, 3-4, 5-6)
    // Posição 7 fica como vaga individual/extendida
    NATURAL_PAIRS: [
        [1, 2],
        [3, 4],
        [5, 6]
    ],

    // VAGAS EXTENDIDAS - números das vagas que são especiais
    VAGAS_EXTENDIDAS: [
        7,   // G1-A posição 7 = vaga 7
        14,  // G1-B posição 7 = vaga 14  
        21,  // G2-C posição 7 = vaga 21
        28,  // G2-D posição 7 = vaga 28
        35,  // G3-E posição 7 = vaga 35
        42   // G3-F posição 7 = vaga 42
    ],

    // APARTAMENTOS COM DIREITO A VAGAS EXTENDIDAS
    APARTAMENTOS_VAGAS_EXTENDIDAS: [
        101, // Apartamento 101 pode concorrer a vagas extendidas
        103, // Apartamento 103 pode concorrer a vagas extendidas
        105, // Apartamento 105 pode concorrer a vagas extendidas
        201, // Apartamento 201 pode concorrer a vagas extendidas
        203, // Apartamento 203 pode concorrer a vagas extendidas
        // Adicione mais apartamentos conforme necessário
    ],

    // APARTAMENTOS COM DIREITO A VAGA DUPLA
    APARTAMENTOS_VAGA_DUPLA: [
        103, // Apartamento 103 tem direito a vaga dupla
        105, // Apartamento 105 tem direito a vaga dupla
        107, // Apartamento 107 tem direito a vaga dupla
        109, // Apartamento 109 tem direito a vaga dupla
        110, // Apartamento 110 tem direito a vaga dupla
        111, // Apartamento 111 tem direito a vaga dupla
        112, // Apartamento 112 tem direito a vaga dupla
        201, // Apartamento 201 tem direito a vaga dupla
        202, // Apartamento 202 tem direito a vaga dupla
        203, // Apartamento 203 tem direito a vaga dupla
        // Adicione mais apartamentos conforme necessário
    ]
};

// Função utilitária para converter posição para número sequencial
export function positionToSequentialNumber(floor, side, position) {
    const floorIndex = VAGAS_CONFIG.FLOORS.indexOf(floor);
    const sidesForFloor = VAGAS_CONFIG.SIDES_BY_FLOOR[floor];
    const sideIndex = sidesForFloor.indexOf(side);

    const baseNumber = floorIndex * VAGAS_CONFIG.VAGAS_POR_ANDAR;
    const sideOffset = sideIndex * VAGAS_CONFIG.VAGAS_POR_LADO;

    return baseNumber + sideOffset + position;
}

// Função utilitária para converter número sequencial para posição
export function sequentialNumberToPosition(vagaNumber) {
    const adjustedNumber = vagaNumber - 1; // Converter para base 0
    const floorIndex = Math.floor(adjustedNumber / VAGAS_CONFIG.VAGAS_POR_ANDAR);
    const remainingInFloor = adjustedNumber % VAGAS_CONFIG.VAGAS_POR_ANDAR;
    const sideIndex = Math.floor(remainingInFloor / VAGAS_CONFIG.VAGAS_POR_LADO);
    const position = (remainingInFloor % VAGAS_CONFIG.VAGAS_POR_LADO) + 1;

    const floor = VAGAS_CONFIG.FLOORS[floorIndex];
    const side = VAGAS_CONFIG.SIDES_BY_FLOOR[floor][sideIndex];

    return { floor, side, position };
}

// Função para verificar se uma vaga é extendida
export function isVagaExtendida(vagaNumber) {
    return VAGAS_CONFIG.VAGAS_EXTENDIDAS.includes(vagaNumber);
}

// Função para verificar se um apartamento pode concorrer a vagas extendidas
export function apartmentoPodeVagaExtendida(apartmentNumber) {
    return VAGAS_CONFIG.APARTAMENTOS_VAGAS_EXTENDIDAS.includes(apartmentNumber);
}

// Função para verificar se um apartamento tem direito a vaga dupla
export function apartamentoTemDireitoDupla(apartmentNumber) {
    return VAGAS_CONFIG.APARTAMENTOS_VAGA_DUPLA.includes(apartmentNumber);
}