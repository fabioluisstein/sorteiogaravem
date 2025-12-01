export class Apartment {
    constructor(id, apartmentNumber = '', ativo = true, dupla = false) {
        this.id = id;
        this.apartmentNumber = apartmentNumber;
        this.ativo = ativo;
        this.dupla = dupla; // usado pelos testes
        this.sorteado = false;
        this.vagas = null;
    }
}
