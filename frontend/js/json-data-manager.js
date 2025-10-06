class JSONDataManager {
    constructor() {
        this.jsonData = null;
        this.processedData = null;
    }

    // Processa o conteúdo JSON do POWER
    processJSONData(jsonContent) {
        try {
            const powerData = typeof jsonContent === 'string' ? 
                JSON.parse(jsonContent) : jsonContent;
            
            console.log('📋 Estrutura do JSON:', powerData);
            
            const { properties, geometry, header, parameters } = powerData;
            
            // Extrai os dados de irradiação
            const irradianceData = properties.parameter.ALLSKY_SFC_SW_DIFF;
            
            if (!irradianceData) {
                throw new Error('Dados ALLSKY_SFC_SW_DIFF não encontrados no JSON');
            }
            
            // Processa os dados mensais
            const monthlyData = [];
            
            Object.entries(irradianceData).forEach(([dateCode, value]) => {
                if (value !== -999 && value !== null && !isNaN(value)) {
                    const year = parseInt(dateCode.substring(0, 4));
                    const month = parseInt(dateCode.substring(4, 6));
                    
                    // Verifica se é um mês válido (1-12)
                    if (month >= 1 && month <= 12) {
                        monthlyData.push({
                            parameter: 'ALLSKY_SFC_SW_DIFF',
                            year: year,
                            month: month,
                            dateCode: dateCode,
                            lat: geometry.coordinates[1], // -22.429
                            lon: geometry.coordinates[0], // -45.458
                            value: value,
                            coordinates: geometry.coordinates
                        });
                    }
                }
            });
            
            this.jsonData = {
                raw: powerData,
                processed: monthlyData,
                metadata: {
                    units: parameters.ALLSKY_SFC_SW_DIFF.units,
                    longname: parameters.ALLSKY_SFC_SW_DIFF.longname,
                    coordinates: geometry.coordinates,
                    timeRange: `${header.start} to ${header.end}`
                }
            };
            
            console.log(`✅ Dados JSON processados: ${monthlyData.length} registros mensais`);
            return this.jsonData;
            
        } catch (error) {
            console.error('❌ Erro ao processar JSON:', error);
            // Em caso de erro, cria dados de fallback
            return this.createFallbackData();
        }
    }

    // NOVO: Filtra apenas o último mês mais recente
    getLatestMonthData() {
        if (!this.jsonData || !this.jsonData.processed) {
            console.warn('Nenhum dado disponível');
            return { data: [], year: null, month: null };
        }
        
        // Encontra o registro mais recente
        const sortedData = [...this.jsonData.processed]
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
        
        if (sortedData.length === 0) {
            return { data: [], year: null, month: null };
        }
        
        const latestRecord = sortedData[0];
        
        // Retorna APENAS o ponto do último mês
        const singlePoint = {
            lat: latestRecord.lat,
            lon: latestRecord.lon,
            value: latestRecord.value,
            year: latestRecord.year,
            month: latestRecord.month,
            parameter: latestRecord.parameter,
            units: this.jsonData.metadata.units
        };
        
        console.log(`📅 Último mês disponível: ${latestRecord.year}-${latestRecord.month.toString().padStart(2, '0')}`);
        console.log(`📍 Localização: ${singlePoint.lat}, ${singlePoint.lon}`);
        console.log(`📊 Valor: ${singlePoint.value} ${singlePoint.units}`);
        
        return {
            data: [singlePoint], // APENAS 1 ponto
            year: latestRecord.year,
            month: latestRecord.month,
            parameter: latestRecord.parameter,
            units: this.jsonData.metadata.units
        };
    }

    // Método antigo (mantido para compatibilidade)
    getLatestData() {
        return this.getLatestMonthData();
    }

    // Filtra dados por ano e mês (opcional)
    filterData(year = 2024, month = 8) {
        if (!this.jsonData || !this.jsonData.processed) return [];
        
        return this.jsonData.processed
            .filter(row => row.year === year && row.month === month)
            .map(row => ({
                lat: row.lat,
                lon: row.lon,
                value: row.value,
                year: row.year,
                month: row.month,
                parameter: row.parameter,
                units: this.jsonData.metadata.units
            }));
    }

    // Carrega dados do arquivo JSON via fetch
    async loadFromFile(filePath) {
        try {
            console.log(`📁 Tentando carregar: ${filePath}`);
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar arquivo: ${response.status}`);
            }
            const jsonText = await response.text();
            console.log('✅ Arquivo carregado com sucesso');
            return this.processJSONData(jsonText);
        } catch (error) {
            console.error('❌ Erro ao carregar JSON:', error);
            // Em caso de erro, cria dados de fallback
            return this.createFallbackData();
        }
    }

    // Cria dados de fallback
    createFallbackData() {
        console.log('📊 Criando dados de fallback...');
        
        const monthlyData = [];
        const baseLat = -22.429;
        const baseLon = -45.458;
        
        // Cria apenas alguns meses recentes
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Últimos 3 meses
        for (let i = 0; i < 3; i++) {
            let month = currentMonth - i;
            let year = currentYear;
            
            if (month < 1) {
                month += 12;
                year -= 1;
            }
            
            const value = 6 + Math.random() * 4; // Valores entre 6-10
            
            monthlyData.push({
                parameter: 'ALLSKY_SFC_SW_DIFF',
                year: year,
                month: month,
                dateCode: `${year}${month.toString().padStart(2, '0')}`,
                lat: baseLat,
                lon: baseLon,
                value: parseFloat(value.toFixed(2)),
                coordinates: [baseLon, baseLat]
            });
        }
        
        this.jsonData = {
            raw: { fallback: true },
            processed: monthlyData,
            metadata: {
                units: 'MJ/m²/day',
                longname: 'All Sky Surface Shortwave Diffuse Irradiance',
                coordinates: [baseLon, baseLat],
                parameter: 'ALLSKY_SFC_SW_DIFF'
            }
        };
        
        console.log('✅ Dados de fallback criados');
        return this.jsonData;
    }

    // Método para múltiplos pontos (se tiver vários arquivos JSON)
    async loadMultiplePoints(filePaths) {
        const allData = [];
        
        for (const filePath of filePaths) {
            try {
                const data = await this.loadFromFile(filePath);
                allData.push(data);
            } catch (error) {
                console.warn(`Erro ao carregar ${filePath}:`, error);
            }
        }
        
        return allData;
    }

    // Converte número do mês para nome
    getMonthName(monthNumber) {
        const months = [
            'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
            'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
        ];
        return months[monthNumber - 1] || 'UNK';
    }

    // Obtém estatísticas dos dados
    getStatistics() {
        if (!this.jsonData || !this.jsonData.processed) return null;
        
        const values = this.jsonData.processed.map(d => d.value).filter(v => !isNaN(v));
        
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            count: values.length,
            units: this.jsonData.metadata.units
        };
    }
}