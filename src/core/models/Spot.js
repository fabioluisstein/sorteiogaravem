export class Spot {
    constructor(config) {
        this.id = config.id;
        this.andar = config.andar;
        this.setor = config.setor;
        this.posicao = config.posicao;
        this.estendida = !!config.estendida;
        this.ocupada = false;
        this.apartamento = null;
        this.vip = !!config.vip;
    }
}
