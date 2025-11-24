// Leitor de configurações do arquivo .properties
export class ConfigReader {
  constructor() {
    this.config = this.loadDefaultConfig();
  }

  // Configuração padrão (fallback)
  loadDefaultConfig() {
    return {
      vagas_g1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      vagas_g2: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
      vagas_g3: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
      vagas_estendidas: [7, 8, 21, 22, 35, 36],
      vagas_proibidas_duplo: [7, 8, 21, 22, 35, 36], // 🎯 NOVO: Vagas proibidas para pares duplos
      apartamentos_vagas_duplas: [101, 102, 103, 104, 203, 301, 304, 402, 404, 501, 502, 604, 701, 702],
      apartamentos_vagas_estendidas: [403, 503, 603, 703],
      total_vagas: 42,
      vagas_por_andar: 14,
      vagas_por_lado: 7,
      andares: ['G1', 'G2', 'G3'],
      lados_g1: ['A', 'B'],
      lados_g2: ['C', 'D'],
      lados_g3: ['E', 'F'],
      balancear_distribuicao: true,
      proteger_pares_duplas: true,
      permitir_simples_em_par: true,
      log_detalhado: true
    };
  }

  // Carrega configurações do arquivo .properties (para futuro uso)
  async loadFromFile(propertiesText) {
    const config = { ...this.config };
    const lines = propertiesText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=');
        if (key && value) {
          config[key.trim()] = this.parseValue(key.trim(), value.trim());
        }
      }
    }

    this.config = config;

    // 🔄 CONVERSÃO AUTOMÁTICA: Vagas estendidas excedentes → vagas simples
    this.convertExcessExtendedToSimple();

    return config;
  }

  // Parse dos valores baseado no tipo da propriedade
  parseValue(key, value) {
    // Arrays de números (vagas, apartamentos)
    if (key.includes('vagas_') || key.includes('apartamentos_')) {
      return value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n));
    }

    // Arrays de strings (andares, lados)
    if (key.includes('andares') || key.includes('lados_')) {
      return value.split(',').map(v => v.trim());
    }

    // Booleanos
    if (['balancear_distribuicao', 'proteger_pares_duplas', 'permitir_simples_em_par', 'log_detalhado'].includes(key)) {
      return value.toLowerCase() === 'true';
    }

    // Números
    if (['total_vagas', 'vagas_por_andar', 'vagas_por_lado'].includes(key)) {
      return parseInt(value);
    }

    // String padrão
    return value;
  }

  // Getters para facilitar o uso
  get vagasG1() { return this.config.vagas_g1; }
  get vagasG2() { return this.config.vagas_g2; }
  get vagasG3() { return this.config.vagas_g3; }
  get todasVagas() { return [...this.vagasG1, ...this.vagasG2, ...this.vagasG3]; }

  get vagasEstendidas() { return this.config.vagas_estendidas; }
  get vagasProibidasDuplo() { return this.config.vagas_proibidas_duplo; } // 🎯 NOVO
  get apartamentosVagasDuplas() { return this.config.apartamentos_vagas_duplas; }
  get apartamentosVagasEstendidas() { return this.config.apartamentos_vagas_estendidas; }

  get totalVagas() { return this.config.total_vagas; }
  get vagasPorAndar() { return this.config.vagas_por_andar; }
  get vagasPorLado() { return this.config.vagas_por_lado; }

  get andares() { return this.config.andares; }
  get ladosG1() { return this.config.lados_g1; }
  get ladosG2() { return this.config.lados_g2; }
  get ladosG3() { return this.config.lados_g3; }

  get balancearDistribuicao() { return this.config.balancear_distribuicao; }
  get protegerParesDuplas() { return this.config.proteger_pares_duplas; }
  get permitirSimplesEmPar() { return this.config.permitir_simples_em_par; }
  get logDetalhado() { return this.config.log_detalhado; }

  // Métodos utilitários
  isVagaEstendida(vagaNumero) {
    return this.vagasEstendidas.includes(vagaNumero);
  }

  apartamentoTemVagaDupla(apartamento) {
    return this.apartamentosVagasDuplas.includes(apartamento);
  }

  apartamentoPodeVagaEstendida(apartamento) {
    return this.apartamentosVagasEstendidas.includes(apartamento);
  }

  getVagasPorAndar(andar) {
    switch (andar) {
      case 'G1': return this.vagasG1;
      case 'G2': return this.vagasG2;
      case 'G3': return this.vagasG3;
      default: return [];
    }
  }

  getLadosPorAndar(andar) {
    switch (andar) {
      case 'G1': return this.ladosG1;
      case 'G2': return this.ladosG2;
      case 'G3': return this.ladosG3;
      default: return [];
    }
  }

  // Converte número da vaga para posição (andar, lado, posição)
  vagaToPosition(vagaNumero) {
    const andar = this.getAndarByVaga(vagaNumero);
    if (!andar) return null;

    const vagasAndar = this.getVagasPorAndar(andar);
    const indexNoAndar = vagasAndar.indexOf(vagaNumero);
    const lados = this.getLadosPorAndar(andar);

    const lado = indexNoAndar < this.vagasPorLado ? lados[0] : lados[1];
    const posicao = (indexNoAndar % this.vagasPorLado) + 1;

    return { andar, lado, posicao };
  }

  // Converte posição para número da vaga
  positionToVaga(andar, lado, posicao) {
    const lados = this.getLadosPorAndar(andar);
    const ladoIndex = lados.indexOf(lado);
    const vagasAndar = this.getVagasPorAndar(andar);

    const indexNoAndar = ladoIndex * this.vagasPorLado + (posicao - 1);
    return vagasAndar[indexNoAndar];
  }

  getAndarByVaga(vagaNumero) {
    if (this.vagasG1.includes(vagaNumero)) return 'G1';
    if (this.vagasG2.includes(vagaNumero)) return 'G2';
    if (this.vagasG3.includes(vagaNumero)) return 'G3';
    return null;
  }

  // Gera configuração para o componente React
  generateReactConfig() {
    return {
      FLOORS: this.andares,
      SIDES_BY_FLOOR: {
        G1: this.ladosG1,
        G2: this.ladosG2,
        G3: this.ladosG3
      },
      POSITIONS: Array.from({ length: this.vagasPorLado }, (_, i) => i + 1),
      TOTAL_VAGAS: this.totalVagas,
      VAGAS_EXTENDIDAS: this.vagasEstendidas,
      APARTAMENTOS_VAGA_DUPLA: this.apartamentosVagasDuplas,
      APARTAMENTOS_VAGAS_EXTENDIDAS: this.apartamentosVagasEstendidas
    };
  }

  // Validação de exclusividade entre tipos de apartamento
  validateTypeExclusivity() {
    const errors = [];
    const duplas = this.apartamentosVagasDuplas || [];
    const estendidas = this.apartamentosVagasEstendidas || [];

    // Verifica se algum apartamento está em ambas as listas
    const duplicados = duplas.filter(apt => estendidas.includes(apt));

    if (duplicados.length > 0) {
      errors.push(`Apartamentos com conflito de tipo (dupla e estendida): ${duplicados.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Obter tipo exclusivo do apartamento
  getExclusiveApartmentType(apartmentId) {
    const validation = this.validateTypeExclusivity();

    if (!validation.isValid) {
      console.warn('Configuração de tipos de apartamento com conflitos:', validation.errors);
    }

    // Prioridade: estendida > dupla > simples
    if (this.apartamentoPodeVagaEstendida(apartmentId)) {
      return 'estendida';
    }

    if (this.apartamentoTemVagaDupla(apartmentId)) {
      return 'dupla';
    }

    return 'simples';
  }

  // 🔄 CONVERSÃO: Vagas estendidas excedentes → vagas simples
  convertExcessExtendedToSimple() {
    const vagasEstendidas = [...(this.config.vagas_estendidas || [])];
    const apartamentosExtendidos = [...(this.config.apartamentos_vagas_estendidas || [])];

    // Calcular excedentes
    const excedentes = vagasEstendidas.length - apartamentosExtendidos.length;

    if (excedentes > 0) {
      console.log(`🔄 DETECTADO: ${excedentes} vaga(s) estendida(s) excedente(s)`);
      console.log(`   - Apartamentos estendidos: ${apartamentosExtendidos.length}`);
      console.log(`   - Vagas estendidas: ${vagasEstendidas.length}`);

      // 🚫 CORREÇÃO CRÍTICA: NÃO remover vagas da lista de estendidas!
      // Vagas estendidas são fisicamente estendidas e NUNCA podem ser simples
      // Em vez disso, apenas alertamos sobre a sobra
      const vagasOrfas = vagasEstendidas.slice(-excedentes);

      console.log(`⚠️ VAGAS ESTENDIDAS ÓRFÃS: ${vagasOrfas.join(', ')}`);
      console.log(`🔒 Estas vagas permanecem estendidas e ficam RESERVADAS`);
      console.log(`   - Vagas estendidas ativas: ${vagasEstendidas.slice(0, apartamentosExtendidos.length).join(', ')}`);
      console.log(`   - Vagas estendidas órfãs (bloqueadas): ${vagasOrfas.join(', ')}`);
      console.log(`   ✅ MANUTENÇÃO: ${apartamentosExtendidos.length} apartamentos para ${apartamentosExtendidos.length} vagas ativas`);
      console.log(`   🔒 BLOQUEADAS: ${excedentes} vagas estendidas órfãs protegidas`);

      // NÃO alterar this.config.vagas_estendidas - manter todas as vagas estendidas protegidas!
    } else {
      console.log(`✅ Vagas estendidas balanceadas: ${vagasEstendidas.length} vagas para ${apartamentosExtendidos.length} apartamentos`);
    }
  }
}

// Instância global da configuração
export const sorteioConfig = new ConfigReader();

// 🎯 NOVO: Função para obter lista completa de vagas proibidas para duplos
export const getVagasProibidasDuplo = () => {
  const vagasProibidasBase = [...(sorteioConfig.vagasProibidasDuplo || [])];
  const vagasEstendidas = [...(sorteioConfig.vagasEstendidas || [])];

  // Somar vagas estendidas às proibidas (evitar duplicatas)
  const vagasProibidasCompleta = [...new Set([...vagasProibidasBase, ...vagasEstendidas])];

  console.log(`🚫 Vagas proibidas para pares duplos: ${vagasProibidasCompleta.join(', ')}`);
  console.log(`   - Base (configuradas): ${vagasProibidasBase.join(', ')}`);
  console.log(`   - Estendidas (somadas): ${vagasEstendidas.join(', ')}`);
  console.log(`   - Config debug: vagasProibidasDuplo=${JSON.stringify(sorteioConfig.vagasProibidasDuplo)}, vagasEstendidas=${JSON.stringify(sorteioConfig.vagasEstendidas)}`);

  return vagasProibidasCompleta;
};

// Função para carregar configuração do arquivo .properties
export const loadConfigFromFile = async () => {
  try {
    console.log('🔍 Tentando carregar /sorteio.properties...');
    const response = await fetch('/sorteio.properties');
    if (response.ok) {
      const propertiesText = await response.text();
      console.log('📄 Arquivo carregado, tamanho:', propertiesText.length, 'caracteres');
      console.log('📄 Primeiras linhas do arquivo:', propertiesText.split('\n').slice(0, 5));

      await sorteioConfig.loadFromFile(propertiesText);

      // Debug: verificar valores carregados
      console.log('🔧 Apartamentos duplos carregados:', sorteioConfig.apartamentosVagasDuplas);
      console.log('🔧 Apartamentos extendidos carregados:', sorteioConfig.apartamentosVagasEstendidas);
      console.log('🔧 ⭐ VAGAS ESTENDIDAS carregadas:', sorteioConfig.vagasEstendidas);

      console.log('✅ Configuração carregada do arquivo sorteio.properties');
      return true;
    } else {
      console.warn('⚠️ Não foi possível carregar o arquivo sorteio.properties (status:', response.status, '), usando configuração padrão');
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar configuração:', error.message, '- usando configuração padrão');
    return false;
  }
};

// Funções de conveniência (compatibilidade com código existente)
export const apartamentoTemDireitoDupla = (apartamento) =>
  sorteioConfig.apartamentoTemVagaDupla(apartamento);

export const apartmentoPodeVagaEstendida = (apartamento) =>
  sorteioConfig.apartamentoPodeVagaEstendida(apartamento);

export const positionToSequentialNumber = (floor, side, position) =>
  sorteioConfig.positionToVaga(floor, side, position);

export const isVagaEstendida = (vagaNumero) =>
  sorteioConfig.isVagaEstendida(vagaNumero);

// Nova função para obter tipo exclusivo
export const getExclusiveApartmentType = (apartamento) =>
  sorteioConfig.getExclusiveApartmentType(apartamento);

// Função de validação
export const validateConfigExclusivity = () =>
  sorteioConfig.validateTypeExclusivity();

// Exporta a configuração no formato antigo para compatibilidade
export const VAGAS_CONFIG = sorteioConfig.generateReactConfig();