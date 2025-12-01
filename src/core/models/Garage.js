export class Garage {
    constructor() {
        this.spots = [];
    }

    addSpot(spot) {
        this.spots.push(spot);
    }

    findSpotById(id) {
        return this.spots.find(s => s.id === id);
    }
}
