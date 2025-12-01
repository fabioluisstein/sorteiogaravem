export const sorteioConfig = {
    vagasEstendidas: [7, 8, 21, 22, 35, 36],
    apartamentosVagasDuplas: [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702],
    apartamentosVagasEstendidas: [603, 204, 704, 401]
};

export async function loadConfigFromFile() {
    // Placeholder: em repositórios reais leríamos um arquivo JSON.
    // Aqui apenas asseguramos que a configuração está disponível para os testes.
    return Promise.resolve();
}
