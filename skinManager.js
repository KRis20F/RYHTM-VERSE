class SkinManager {
    constructor() {
        this.skinElements = null;
        this.defaultSkin = {
            judgements: {
                bad: './assets/skins/bad.png',
                good: './assets/skins/good.png',
                combo: './assets/skins/combo.png',
                marvelous: './assets/skins/marvelous.png',
                sick: './assets/skins/sick.png',
                shit: './assets/skins/shit.png'
            },
            numbers: Array.from({ length: 10 }, (_, i) => `./assets/skins/num${i}.png`),
            menu: {
                background: './assets/skins/menuBGMagenta.png',
                desat: './skin/menuDesat.png'
            }
        };
    }

    async initialize() {
        try {
            await this.loadDefaultSkin();
            console.log('Skin inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar el skin:', error);
        }
    }

    async loadDefaultSkin() {
        this.skinElements = {
            judgements: {},
            numbers: [],
            menu: {}
        };

        try {
            // Cargar juicios
            for (const [key, path] of Object.entries(this.defaultSkin.judgements)) {
                const response = await fetch(path);
                const blob = await response.blob();
                this.skinElements.judgements[key] = await createImageBitmap(blob);
            }

            // Cargar números
            for (const path of this.defaultSkin.numbers) {
                const response = await fetch(path);
                const blob = await response.blob();
                this.skinElements.numbers.push(await createImageBitmap(blob));
            }

            // Cargar menú
            for (const [key, path] of Object.entries(this.defaultSkin.menu)) {
                const response = await fetch(path);
                const blob = await response.blob();
                this.skinElements.menu[key] = await createImageBitmap(blob);
            }
        } catch (error) {
            console.error('Error al cargar el skin:', error);
            throw error;
        }
    }

    getJudgement(name) {
        return this.skinElements?.judgements[name];
    }

    getNumber(num) {
        return this.skinElements?.numbers[num];
    }

    getMenuElement(name) {
        return this.skinElements?.menu[name];
    }
}

export const skinManager = new SkinManager();
