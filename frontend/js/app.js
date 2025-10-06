// Aplicação Principal
class EcoPlanApp {
    constructor() {
        this.mapManager = null;
        this.uiManager = null;
        this.init();
    }

    init() {
        // Inicializa componentes
        this.mapManager = new MapManager();
        this.uiManager = new UIManager();
        
        // Configurações globais
        this.setupGlobalFunctions();
        
        console.log('EcoPlan App inicializado com sucesso!');
    }

    setupGlobalFunctions() {
        // Funções globais para acesso externo
        window.toggleHeatLayer = () => this.mapManager.toggleHeatLayer();
        window.toggleVegetationLayer = () => this.mapManager.toggleVegetationLayer();
    }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EcoPlanApp();
});