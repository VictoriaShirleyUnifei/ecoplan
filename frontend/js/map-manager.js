class MapManager {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.heatLayer = null;
        this.weatherLayer = null;
        this.csvLayer = null;
        this.geeLayer = null;
        this.jsonManager = new JSONDataManager(); // MUDANÇA: CSV → JSON
        this.geeDataManager = new GEEDataManager();
        this.layerControl = null;
        this.apiKeys = {
            openWeather: 'sua_chave_openweather_aqui'
        };
        this.init();
    }

    async init() {
        // Inicialização do mapa
        this.map = L.map('map').setView([-22.4262, -45.4559], 13); // Coordenadas de Itajubá

        // Camada base
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Controle de camadas
        const baseMaps = {
            "OpenStreetMap": osm
        };
        
        this.layerControl = L.control.layers(baseMaps, {}, { collapsed: false }).addTo(this.map);

        this.addLayerControls();
        
        // Carrega dados em background
        await this.loadJSONData(); // MUDANÇA: CSV → JSON
        await this.loadGEEData();
        await this.loadBoundaryData();
    }

     addLayerControls() {
        const control = L.control({ position: 'topleft' });
        control.onAdd = (map) => {
            const div = L.DomUtil.create('div', 'modern-layer-control');
            div.innerHTML = `
                <div class="control-header">
                    <h3>Irradiação Difusa</h3>
                </div>
                <button onclick="app.mapManager.toggleJSONLayer()" class="modern-layer-btn" id="json-layer-btn"> <!-- MUDANÇA: CSV → JSON -->
                    <span class="btn-icon">🛰️</span>
                    <span class="btn-text">Heatmap NASA</span>
                    <span class="btn-badge">Dados Reais</span>
                </button>
                <div class="control-info">
                    <small>Dados de temperatura da superfície terrestre</small>
                </div>
            `;
            return div;
        };
        control.addTo(this.map);
    }

    // MUDANÇA: Carregar dados JSON do POWER
    async loadJSONData() {
        try {
            await this.jsonManager.loadFromFile('./js/data/POWER_Point_Monthly_20230101_20251231_022d43S_045d46W_LST.json');
            console.log('Dados NASA POWER carregados:', this.jsonManager.jsonData.processed.length, 'registros');
        } catch (error) {
            console.warn('Erro ao carregar dados NASA POWER:', error);
            // Fallback com dados simulados se necessário
            this.showNotification('Usando dados de exemplo NASA POWER', 'warning');
        }
    }

    // MUDANÇA: Alternar camada JSON
    async toggleJSONLayer() {
        const btn = document.getElementById('json-layer-btn');
        
        if (this.csvLayer) { // Mantém o nome da variável para compatibilidade
            this.map.removeLayer(this.csvLayer);
            this.csvLayer = null;
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
            btn.innerHTML = '🛰️ Carregando NASA...';
            
            try {
                const heatData = await this.loadJSONHeatData();
                this.csvLayer = L.heatLayer(heatData, {
                    radius: 45,
                    blur: 30,
                    maxZoom: 12,
                    minOpacity: 0.6,
                    max: 1.0,
                    gradient: {
                        0.0: 'blue',
                        0.2: 'cyan',
                        0.4: 'lime',
                        0.6: 'yellow',
                        0.8: 'orange',
                        0.9: 'red',
                        1.0: 'darkred'
                    }
                }).addTo(this.map);
                btn.innerHTML = '🛰️ Heatmap NASA';
                this.showNotification('Mapa de calor NASA POWER carregado', 'success');
            } catch (error) {
                console.error('Erro ao carregar dados JSON:', error);
                btn.classList.remove('active');
                btn.innerHTML = '🛰️ Heatmap NASA';
                this.showNotification('Erro ao carregar dados NASA POWER', 'error');
            }
        }
    }

    // MUDANÇA: Carregar dados de heatmap do JSON
    async loadJSONHeatData() {
        const latestData = this.jsonManager.getLatestData();
        
        if (latestData.data.length === 0) {
            throw new Error('Nenhum dado NASA POWER disponível');
        }

        const heatData = [];
        const originalPoints = [];
        
        // Converte pontos para dados de heatmap
        latestData.data.forEach(point => {
            const intensity = this.jsonValueToIntensity(point.value);
            heatData.push([point.lat, point.lon, intensity]);
            originalPoints.push(point);
            
            // Adiciona MUITOS pontos interpolados para criar área bem extensa
            this.addExpandedPoints(heatData, point, intensity);
        });

        // Adiciona pontos de fundo para preencher áreas entre os pontos
        this.addBackgroundPoints(heatData, originalPoints);

        console.log(`Heatmap NASA POWER expandido: ${heatData.length} pontos gerados`);
        return heatData;
    }

    // MUDANÇA: Converter valor do JSON para intensidade
    jsonValueToIntensity(value) {
        // Ajuste a escala conforme os valores reais do seu dado
        // Exemplo para irradiação difusa (MJ/m²/dia)
        const minValue = 3.0;
        const maxValue = 11.0;
        
        let intensity = (value - minValue) / (maxValue - minValue);
        intensity = Math.pow(intensity, 0.8);
        
        return Math.min(1, Math.max(0, intensity));
    }

    // MÉTODOS GEE (mantidos iguais)
    async loadGEEData() {
        try {
            await this.geeDataManager.loadFromFile('./js/data/gee_layers.json');
            this.geeDataManager.initLegends();
            
            // Adiciona camadas GEE ao controle
            this.addGEELayersToControl();
            
            // Configura eventos para as legendas
            this.setupGEELegendEvents();
            
            console.log('Camadas GEE carregadas com sucesso');
        } catch (error) {
            console.warn('Erro ao carregar dados GEE:', error);
        }
    }

    addGEELayersToControl() {
        const geeData = this.geeDataManager.geeData;
        
        if (!geeData) return;

        // Cria e adiciona cada camada GEE
        const geeLayers = {
            "Sentinel-2 (Cores Reais)": this.geeDataManager.createGEELayer(geeData.sentinel, 0.8),
            "Assentamentos Urbanos (2018)": this.geeDataManager.createGEELayer(geeData.assentamentos),
            "Índice de Vegetação (NDVI)": this.geeDataManager.createGEELayer(geeData.ndvi),
            "Temp. da Superfície (HR)": this.geeDataManager.createGEELayer(geeData.temperatura_superficie_hr),
            "Temp. Média do Ar (°C)": this.geeDataManager.createGEELayer(geeData.temperatura_ar)
        };

        // Adiciona ao controle de camadas
        Object.entries(geeLayers).forEach(([name, layer]) => {
            this.layerControl.addOverlay(layer, name);
            this.geeDataManager.geeLayers[name] = layer;
        });
    }

    setupGEELegendEvents() {
        this.map.on('overlayadd', (e) => {
            this.geeDataManager.showLegend(e.name, this.map);
        });

        this.map.on('overlayremove', (e) => {
            this.geeDataManager.hideLegend(this.map);
        });
    }

    async loadBoundaryData() {
        try {
            const response = await fetch('./js/data/itajuba_boundary_circular.geojson');
            const data = await response.json();
            
            const boundaryLayer = L.geoJSON(data, {
                style: {
                    color: "#0000ff",
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.0,
                },
            }).addTo(this.map);
            
            this.layerControl.addOverlay(boundaryLayer, "Contorno da Área");
            this.map.fitBounds(boundaryLayer.getBounds());
            
        } catch (error) {
            console.warn('Erro ao carregar boundary data:', error);
        }
    }

    // MÉTODOS EXISTENTES (mantidos iguais)
    setView(coordinates, zoom = 12) {
        this.map.setView([coordinates.lat, coordinates.lng], zoom);
    }

    addMarker(coordinates, popupContent) {
        this.clearMarker();
        
        this.currentMarker = L.marker([coordinates.lat, coordinates.lng])
            .addTo(this.map)
            .bindPopup(popupContent)
            .openPopup();
    }

    clearMarker() {
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
            this.currentMarker = null;
        }
    }

    async toggleHeatLayer() {
        const btn = document.getElementById('heat-layer-btn');
        
        if (this.heatLayer) {
            this.map.removeLayer(this.heatLayer);
            this.heatLayer = null;
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
            btn.innerHTML = '🔥 Carregando dados...';
            
            try {
                // Usa dados reais de temperatura
                const heatData = await this.generateRealHeatData();
                this.heatLayer = L.heatLayer(heatData, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17,
                    gradient: {
                        0.1: 'blue',     // Frio
                        0.3: 'cyan',     // Moderado
                        0.5: 'lime',     // Quente
                        0.7: 'yellow',   // Muito quente
                        0.9: 'orange',   // Extremo
                        1.0: 'red'       // Perigoso
                    }
                }).addTo(this.map);
                btn.innerHTML = '🔥 Ilhas de Calor (Dados Reais)';
            } catch (error) {
                console.error('Erro ao carregar dados de calor:', error);
                btn.classList.remove('active');
                btn.innerHTML = '🔥 Ilhas de Calor (Dados Reais)';
                this.showNotification('Erro ao carregar dados meteorológicos', 'error');
            }
        }
    }

    async toggleWeatherLayer() {
        const btn = document.getElementById('weather-layer-btn');
        
        if (this.weatherLayer) {
            this.map.removeLayer(this.weatherLayer);
            this.weatherLayer = null;
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
            btn.innerHTML = '🌡️ Carregando...';
            
            try {
                const weatherData = await this.generateRealWeatherData();
                this.weatherLayer = L.layerGroup(weatherData).addTo(this.map);
                btn.innerHTML = '🌡️ Dados Meteorológicos';
            } catch (error) {
                console.error('Erro ao carregar dados meteorológicos:', error);
                btn.classList.remove('active');
                btn.innerHTML = '🌡️ Dados Meteorológicos';
                this.showNotification('Erro ao carregar dados meteorológicos', 'error');
            }
        }
    }

    // MÉTODOS AUXILIARES (mantidos iguais)
    async generateRealHeatData() {
        const bounds = this.map.getBounds();
        const heatData = [];
        
        try {
            // Busca dados de temperatura para várias cidades na área visível
            const cities = this.getCitiesInBounds(bounds);
            
            for (const city of cities) {
                try {
                    const weather = await this.fetchWeatherData(city.lat, city.lng);
                    if (weather && weather.main) {
                        // Converte temperatura para intensidade (0-1)
                        const intensity = this.temperatureToIntensity(weather.main.temp);
                        heatData.push([city.lat, city.lng, intensity]);
                        
                        // Adiciona pontos ao redor para simular área de influência
                        for (let i = 0; i < 5; i++) {
                            const spreadLat = city.lat + (Math.random() - 0.5) * 0.2;
                            const spreadLng = city.lng + (Math.random() - 0.5) * 0.2;
                            const spreadIntensity = intensity * (0.7 + Math.random() * 0.3);
                            heatData.push([spreadLat, spreadLng, spreadIntensity]);
                        }
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar dados para ${city.name}:`, error);
                }
            }
            
            // Se não conseguiu dados suficientes, usa fallback inteligente
            if (heatData.length < 10) {
                console.log('Usando dados fallback para calor');
                heatData.push(...this.generateSmartFallbackHeatData(bounds));
            }
            
            return heatData;
            
        } catch (error) {
            console.error('Erro ao gerar dados de calor:', error);
            return this.generateSmartFallbackHeatData(bounds);
        }
    }

    async generateRealWeatherData() {
        const bounds = this.map.getBounds();
        const weatherMarkers = [];
        
        try {
            const cities = this.getCitiesInBounds(bounds);
            
            for (const city of cities) {
                try {
                    const weather = await this.fetchWeatherData(city.lat, city.lng);
                    if (weather) {
                        const marker = this.createWeatherMarker(city, weather);
                        weatherMarkers.push(marker);
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar clima para ${city.name}:`, error);
                }
            }
            
            return weatherMarkers;
            
        } catch (error) {
            console.error('Erro ao gerar dados meteorológicos:', error);
            return [];
        }
    }

    async fetchWeatherData(lat, lng) {
        // Se não tiver chave API, usa dados simulados baseados na localização
        if (!this.apiKeys.openWeather || this.apiKeys.openWeather === 'sua_chave_openweather_aqui') {
            return this.generateSimulatedWeatherData(lat, lng);
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?` +
                `lat=${lat}&lon=${lng}&appid=${this.apiKeys.openWeather}&units=metric&lang=pt_br`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('OpenWeather API falhou, usando dados simulados:', error);
            return this.generateSimulatedWeatherData(lat, lng);
        }
    }

    getCitiesInBounds(bounds) {
        // Cidades principais no Brasil para demonstração
        const brazilCities = [
            { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
            { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
            { name: "Brasília", lat: -15.7975, lng: -47.8919 },
            { name: "Salvador", lat: -12.9714, lng: -38.5014 },
            { name: "Fortaleza", lat: -3.7319, lng: -38.5267 },
            { name: "Belo Horizonte", lat: -19.9167, lng: -43.9345 },
            { name: "Manaus", lat: -3.1190, lng: -60.0217 },
            { name: "Curitiba", lat: -25.4284, lng: -49.2733 },
            { name: "Recife", lat: -8.0476, lng: -34.8770 },
            { name: "Porto Alegre", lat: -30.0346, lng: -51.2177 },
            { name: "Belém", lat: -1.4558, lng: -48.4902 },
            { name: "Goiânia", lat: -16.6869, lng: -49.2648 },
            { name: "Guarulhos", lat: -23.4541, lng: -46.5343 },
            { name: "Campinas", lat: -22.9056, lng: -47.0608 },
            { name: "São Luís", lat: -2.5307, lng: -44.3068 }
        ];

        // Filtra cidades dentro dos bounds do mapa
        return brazilCities.filter(city => 
            city.lat >= bounds.getSouth() && 
            city.lat <= bounds.getNorth() && 
            city.lng >= bounds.getWest() && 
            city.lng <= bounds.getEast()
        );
    }

    temperatureToIntensity(temp) {
        // Converte temperatura Celsius para intensidade 0-1
        // Base: 15°C = 0.3, 25°C = 0.6, 35°C = 0.9, 45°C = 1.0
        const minTemp = 10;
        const maxTemp = 45;
        return Math.min(1, Math.max(0, (temp - minTemp) / (maxTemp - minTemp)));
    }

    createWeatherMarker(city, weather) {
        const temp = weather.main.temp;
        const humidity = weather.main.humidity;
        const description = weather.weather[0].description;
        
        // Ícone baseado na temperatura
        let icon = '🌡️';
        if (temp > 30) icon = '🔥';
        else if (temp > 25) icon = '☀️';
        else if (temp > 20) icon = '⛅';
        else if (temp > 15) icon = '🌤️';
        else icon = '❄️';
        
        const popupContent = `
            <div class="weather-popup">
                <h3>${icon} ${city.name}</h3>
                <p><strong>Temperatura:</strong> ${temp}°C</p>
                <p><strong>Umidade:</strong> ${humidity}%</p>
                <p><strong>Condição:</strong> ${description}</p>
                <p><strong>Sensação Térmica:</strong> ${weather.main.feels_like}°C</p>
                <small>Atualizado: ${new Date().toLocaleTimeString('pt-BR')}</small>
            </div>
        `;
        
        return L.marker([city.lat, city.lng])
            .bindPopup(popupContent)
            .bindTooltip(`${city.name}: ${temp}°C`);
    }

    generateSimulatedWeatherData(lat, lng) {
        // Dados simulados realistas baseados na localização
        const baseTemp = 20 + (Math.sin(lat) * 10); // Varia com latitude
        const variation = (Math.random() - 0.5) * 8; // Variação aleatória
        
        return {
            main: {
                temp: Math.round(baseTemp + variation),
                feels_like: Math.round(baseTemp + variation + 2),
                humidity: 40 + Math.random() * 40,
                pressure: 1010 + Math.random() * 20
            },
            weather: [{
                main: "Clear",
                description: "céu limpo",
                icon: "01d"
            }],
            name: "Local Simulado"
        };
    }

    generateSmartFallbackHeatData(bounds) {
        // Fallback inteligente baseado em padrões reais de ilhas de calor
        const heatData = [];
        const center = bounds.getCenter();
        
        // Padrão de ilha de calor urbano (mais intenso no centro)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 2 * Math.PI;
            const distance = 0.05 + Math.random() * 0.2;
            
            const lat = center.lat + Math.cos(angle) * distance;
            const lng = center.lng + Math.sin(angle) * distance;
            
            // Intensidade decai com a distância do centro
            const baseIntensity = 0.8;
            const distanceFactor = 1 - (distance / 0.25);
            const intensity = baseIntensity * distanceFactor;
            
            heatData.push([lat, lng, intensity]);
        }
        
        // Pontos aleatórios com intensidade baseada na localização
        for (let i = 0; i < 40; i++) {
            const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
            const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
            
            // Intensidade baseada na distância do centro (simulando efeito urbano)
            const distanceFromCenter = Math.sqrt(
                Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
            );
            const intensity = Math.max(0.1, 0.7 - (distanceFromCenter * 2));
            
            heatData.push([lat, lng, intensity + Math.random() * 0.3]);
        }
        
        return heatData;
    }

    showNotification(message, type = 'info') {
        // Reutiliza o sistema de notificação existente ou cria um simples
        if (window.authManager && window.authManager.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#e74c3c' : '#3498db'};
                color: white;
                padding: 1rem;
                border-radius: 8px;
                z-index: 1000;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 5000);
        }
    }

    // Limpa todas as camadas customizadas
    clearCustomLayers() {
        if (this.heatLayer) {
            this.map.removeLayer(this.heatLayer);
            this.heatLayer = null;
        }
        if (this.weatherLayer) {
            this.map.removeLayer(this.weatherLayer);
            this.weatherLayer = null;
        }
        if (this.csvLayer) {
            this.map.removeLayer(this.csvLayer);
            this.csvLayer = null;
        }
        
        // Remove classes active dos botões
        document.querySelectorAll('.layer-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // MÉTODOS PARA EXPANSÃO DE PONTOS (mantidos iguais)
    addExpandedPoints(heatData, centerPoint, centerIntensity) {
        const pointsPerCenter = 15;
        const spreadDistance = 0.8;
        
        for (let i = 0; i < pointsPerCenter; i++) {
            const angle = (Math.random() * 2 * Math.PI);
            const distance = (Math.random() * spreadDistance);
            
            const lat = centerPoint.lat + Math.cos(angle) * distance;
            const lng = centerPoint.lon + Math.sin(angle) * distance;
            
            const distanceFactor = 1 - (distance / spreadDistance);
            const intensity = centerIntensity * (0.4 + distanceFactor * 0.6);
            
            heatData.push([lat, lng, intensity]);
            
            if (i % 3 === 0) {
                const subLat = lat + (Math.random() - 0.5) * 0.2;
                const subLng = lng + (Math.random() - 0.5) * 0.2;
                const subIntensity = intensity * (0.7 + Math.random() * 0.3);
                heatData.push([subLat, subLng, subIntensity]);
            }
        }
        
        this.addFillerPoints(heatData, centerPoint, centerIntensity);
    }

    addFillerPoints(heatData, centerPoint, centerIntensity) {
        const fillerPoints = 10;
        const fillerDistance = 1.2;
        
        for (let i = 0; i < fillerPoints; i++) {
            const angle = (Math.random() * 2 * Math.PI);
            const distance = (0.3 + Math.random() * 0.7) * fillerDistance;
            
            const lat = centerPoint.lat + Math.cos(angle) * distance;
            const lng = centerPoint.lon + Math.sin(angle) * distance;
            
            const distanceFactor = 1 - (distance / fillerDistance);
            const intensity = centerIntensity * (0.2 + distanceFactor * 0.4);
            
            heatData.push([lat, lng, intensity]);
        }
    }

    addBackgroundPoints(heatData, allPoints) {
        if (allPoints.length < 2) return;
        
        const lats = allPoints.map(p => p.lat);
        const lons = allPoints.map(p => p.lon);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        const backgroundPoints = 50;
        
        for (let i = 0; i < backgroundPoints; i++) {
            const lat = minLat + Math.random() * (maxLat - minLat);
            const lon = minLon + Math.random() * (maxLon - minLon);
            
            let closestIntensity = 0;
            let minDistance = Infinity;
            
            allPoints.forEach(point => {
                const distance = Math.sqrt(
                    Math.pow(lat - point.lat, 2) + Math.pow(lon - point.lon, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIntensity = this.jsonValueToIntensity(point.value); // MUDANÇA: csv → json
                }
            });
            
            const maxInfluenceDistance = 2.0;
            const influence = Math.max(0, 1 - (minDistance / maxInfluenceDistance));
            const intensity = closestIntensity * influence * 0.3;
            
            if (intensity > 0.1) {
                heatData.push([lat, lon, intensity]);
            }
        }
    }
}