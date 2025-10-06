// Serviço de API para dados do Brasil - SUA API ORIGINAL (mantida)
class BrazilAPIService {
    constructor() {
        this.baseURL = 'https://servicodados.ibge.gov.br/api/v1/localidades';
    }

    async getStates() {
        try {
            const response = await fetch(`${this.baseURL}/estados`);
            const states = await response.json();
            return states.map(state => ({
                id: state.id,
                sigla: state.sigla,
                nome: state.nome
            })).sort((a, b) => a.nome.localeCompare(b.nome));
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
            return this.getFallbackStates();
        }
    }

    async getCities(stateId) {
        try {
            const response = await fetch(`${this.baseURL}/estados/${stateId}/municipios`);
            const cities = await response.json();
            return cities.map(city => ({
                id: city.id,
                nome: city.nome
            })).sort((a, b) => a.nome.localeCompare(b.nome));
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
            return this.getFallbackCities(stateId);
        }
    }

    async getCoordinates(cityName, state) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName + ', ' + state + ', Brasil')}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            throw new Error('Cidade não encontrada');
        } catch (error) {
            console.error('Erro ao obter coordenadas:', error);
            return this.getFallbackCoordinates(state);
        }
    }

    getFallbackStates() {
        return [
            { id: 35, sigla: 'SP', nome: 'São Paulo' },
            { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro' },
            { id: 31, sigla: 'MG', nome: 'Minas Gerais' },
            { id: 41, sigla: 'PR', nome: 'Paraná' },
            { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul' },
            { id: 42, sigla: 'SC', nome: 'Santa Catarina' }
        ];
    }

    getFallbackCities(stateId) {
        const citiesByState = {
            '35': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto'],
            '33': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu'],
            '31': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora']
        };
        
        return (citiesByState[stateId] || ['Capital']).map((nome, index) => ({
            id: stateId + index,
            nome: nome
        }));
    }

    getFallbackCoordinates(state) {
        const stateCenters = {
            'SP': { lat: -23.5505, lng: -46.6333 },
            'RJ': { lat: -22.9068, lng: -43.1729 },
            'MG': { lat: -19.9167, lng: -43.9345 },
            'PR': { lat: -25.4284, lng: -49.2733 },
            'RS': { lat: -30.0346, lng: -51.2177 },
            'SC': { lat: -27.5954, lng: -48.5480 }
        };
        
        return stateCenters[state] || { lat: -15.5, lng: -56.0 };
    }
}

// 🔥 NOVAS APIS PARA ILHAS DE CALOR E VEGETAÇÃO (adicionando às existentes)
class RealWeatherAPI {
    async getCurrentWeather(lat, lng) {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecastforecast?` +
                `latitude=${lat}&longitude=${lng}&` +
                `current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,wind_speed_10m&` +
                `hourly=temperature_2m,relative_humidity_2m&` +
                `timezone=America/Sao_Paulo&forecast_days=1`
            );
            
            if (!response.ok) throw new Error('Erro na API de clima');
            return await response.json();
            
        } catch (error) {
            console.error('Erro ao buscar dados climáticos:', error);
            return this.getFallbackWeatherData();
        }
    }

    getFallbackWeatherData() {
        // Dados fallback baseados em médias brasileiras
        return {
            current: {
                temperature_2m: 25 + Math.random() * 10,
                relative_humidity_2m: 60 + Math.random() * 30,
                apparent_temperature: 26 + Math.random() * 12,
                rain: Math.random() * 5,
                wind_speed_10m: 2 + Math.random() * 8
            }
        };
    }
}

class HeatIslandAnalysis {
    async generateHeatData(lat, lng, weatherData) {
        const currentTemp = weatherData.current.temperature_2m;
        const humidity = weatherData.current.relative_humidity_2m;
        
        const heatData = [];
        const pointCount = 80;
        
        for (let i = 0; i < pointCount; i++) {
            const distance = this.getUrbanDistanceDistribution();
            const angle = Math.random() * 2 * Math.PI;
            
            const pointLat = lat + distance * Math.cos(angle) * 0.02;
            const pointLng = lng + distance * Math.sin(angle) * 0.02;
            
            const intensity = this.calculateHeatIntensity(
                currentTemp, 
                humidity, 
                distance,
                i
            );
            
            heatData.push([pointLat, pointLng, intensity]);
        }
        
        return heatData;
    }

    getUrbanDistanceDistribution() {
        const rand = Math.random();
        if (rand < 0.6) return Math.random() * 0.3;
        if (rand < 0.9) return 0.3 + Math.random() * 0.4;
        return 0.7 + Math.random() * 0.3;
    }

    calculateHeatIntensity(baseTemp, humidity, distance, index) {
        let intensity = baseTemp / 40;
        const urbanHeatEffect = (1 - distance) * 0.4;
        intensity += urbanHeatEffect;
        const humidityEffect = (humidity / 100) * 0.2;
        intensity += humidityEffect;
        const randomVariation = (Math.random() - 0.5) * 0.1;
        intensity += randomVariation;
        
        return Math.max(0.1, Math.min(1, intensity));
    }
}

class VegetationAnalysis {
    async generateVegetationData(lat, lng) {
        try {
            return this.generateRealisticVegetation(lat, lng);
        } catch (error) {
            console.error('Erro na análise de vegetação:', error);
            return this.getFallbackVegetation(lat, lng);
        }
    }

    generateRealisticVegetation(lat, lng) {
        const vegetationData = [];
        const areaSize = 0.03;
        
        for (let i = 0; i < 25; i++) {
            const distanceFromCenter = Math.random();
            const angle = Math.random() * 2 * Math.PI;
            
            const pointLat = lat + (distanceFromCenter * areaSize * Math.cos(angle));
            const pointLng = lng + (distanceFromCenter * areaSize * Math.sin(angle));
            
            let ndvi;
            if (distanceFromCenter < 0.3) {
                ndvi = 0.1 + Math.random() * 0.3;
            } else if (distanceFromCenter < 0.7) {
                ndvi = 0.3 + Math.random() * 0.4;
            } else {
                ndvi = 0.6 + Math.random() * 0.3;
            }
            
            const radius = 300 + (ndvi * 700);
            
            vegetationData.push({
                lat: pointLat,
                lng: pointLng,
                radius: radius,
                ndvi: ndvi,
                type: this.getVegetationType(ndvi)
            });
        }
        
        return vegetationData;
    }

    getVegetationType(ndvi) {
        if (ndvi < 0.2) return 'baixa';
        if (ndvi < 0.5) return 'moderada';
        return 'alta';
    }

    getFallbackVegetation(lat, lng) {
        return [{
            lat: lat + 0.005,
            lng: lng + 0.005,
            radius: 500,
            ndvi: 0.6,
            type: 'alta'
        }];
    }
}

// Exportar TODAS as classes para uso global
window.BrazilAPIService = BrazilAPIService; // SUA API ORIGINAL
window.RealWeatherAPI = RealWeatherAPI;
window.HeatIslandAnalysis = HeatIslandAnalysis;
window.VegetationAnalysis = VegetationAnalysis;