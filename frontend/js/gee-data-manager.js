// js/GEEDataManager.js
class GEEDataManager {
    constructor() {
        this.geeData = null;
        this.geeLayers = {};
        this.legends = {};
        this.currentLegend = null;
    }

    // Carrega dados do arquivo JSON
    async loadFromFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar arquivo GEE: ${response.status}`);
            }
            this.geeData = await response.json();
            console.log('Dados GEE carregados:', Object.keys(this.geeData));
            return this.geeData;
        } catch (error) {
            console.error('Erro ao carregar dados GEE:', error);
            throw error;
        }
    }

    // Cria uma camada GEE
    createGEELayer(layerData, opacity = 0.7) {
        return L.tileLayer(layerData.urlFormat, {
            attribution: 'Google Earth Engine',
            opacity: opacity
        });
    }

    // Cria legenda de gradiente
    createGradientLegend(grades, colors, title) {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend gee-legend');
            div.innerHTML += `<strong>${title}</strong><br>`;
            
            for (let i = 0; i < colors.length; i++) {
                div.innerHTML +=
                    `<i style="background:${colors[i]}"></i> ${grades[i]}` +
                    (grades[i + 1] ? '<br>' : '');
            }
            return div;
        };
        
        return legend;
    }

    // Cria legenda de texto
    createTextLegend(title, text) {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend gee-legend');
            div.innerHTML = `<strong>${title}</strong><br>${text}`;
            return div;
        };
        
        return legend;
    }

    // Inicializa as legendas
    initLegends() {
        this.legends = {
            "Sentinel-2 (Cores Reais)": this.createTextLegend(
                "Sentinel-2",
                "Imagem de satélite com cores reais."
            ),
            "Assentamentos Urbanos (2018)": this.createGradientLegend(
                ["Baixa", "Média", "Alta"],
                ["#fed98e", "#fe9929", "#d95f0e"],
                "Densidade Construída"
            ),
            "Índice de Vegetação (NDVI)": this.createGradientLegend(
                ["Água/Solo", "Pouca Veg.", "Veg. Densa"],
                ["blue", "white", "green"],
                "Saúde da Vegetação"
            ),
            "Temp. da Superfície (HR)": this.createGradientLegend(
                ["25°C (Frio)", "35°C (Neutro)", "45°C (Quente)"],
                ["#040274", "#3ff38f", "#ff0000"],
                "Temp. Superfície (Landsat)"
            ),
            "Temp. Média do Ar (°C)": this.createGradientLegend(
                ["15", "20", "25"],
                ["#000080", "#FFFFFF", "#FF0000"],
                "Temp. Média (Ar - ERA5)"
            )
        };
    }

    // Gerencia a exibição da legenda
    showLegend(layerName, map) {
        this.hideLegend(map);
        
        if (this.legends[layerName]) {
            this.currentLegend = this.legends[layerName];
            this.currentLegend.addTo(map);
        }
    }

    hideLegend(map) {
        if (this.currentLegend) {
            map.removeControl(this.currentLegend);
            this.currentLegend = null;
        }
    }
}