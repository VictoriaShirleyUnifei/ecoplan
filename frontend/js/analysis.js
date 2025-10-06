// Gerenciador da Tela de Análises
class AnalysisManager {
    constructor() {
        this.analyses = [];
        this.init();
    }

    init() {
        this.loadAnalyses();
        this.initializeEventListeners();
        this.renderRecentAnalyses();
    }

    loadAnalyses() {
        // Carrega análises do localStorage ou usa dados padrão
        const savedAnalyses = localStorage.getItem('EcoPlan-analyses');
        
        if (savedAnalyses) {
            this.analyses = JSON.parse(savedAnalyses);
        } else {
            // Dados de exemplo
            this.analyses = [
                {
                    id: 1,
                    type: 'heat',
                    name: 'Centro de São Paulo - Análise Térmica',
                    description: 'Identificação de áreas críticas e propostas de mitigação',
                    location: 'São Paulo, SP',
                    status: 'completed',
                    duration: '45 min',
                    date: '2024-01-15',
                    results: {
                        criticalAreas: 3,
                        avgTemperature: 29.5,
                        recommendations: 5
                    }
                },
                {
                    id: 2,
                    type: 'vegetation',
                    name: 'Zona Norte - Cobertura Vegetal',
                    description: 'Análise de NDVI e oportunidades de expansão verde',
                    location: 'Rio de Janeiro, RJ',
                    status: 'completed',
                    duration: '1h 20min',
                    date: '2024-01-12',
                    results: {
                        ndvi: 0.45,
                        greenCover: '28%',
                        expansionAreas: 8
                    }
                },
                {
                    id: 3,
                    type: 'mobility',
                    name: 'Corredor Central - Acessibilidade',
                    description: 'Análise de fluxos e proposta de corredor de transporte',
                    location: 'Belo Horizonte, MG',
                    status: 'processing',
                    progress: 65,
                    duration: '2h 15min',
                    date: '2024-01-10'
                },
                {
                    id: 4,
                    type: 'sustainability',
                    name: 'Bairro Sustentável - Indicadores',
                    description: 'Avaliação de pegada ecológica e eficiência energética',
                    location: 'Curitiba, PR',
                    status: 'completed',
                    duration: '1h 45min',
                    date: '2024-01-08',
                    results: {
                        sustainabilityIndex: 7.2,
                        energyEfficiency: 'Boa',
                        improvements: 12
                    }
                }
            ];
            this.saveAnalyses();
        }
    }

    saveAnalyses() {
        localStorage.setItem('EcoPlan-analyses', JSON.stringify(this.analyses));
    }

    initializeEventListeners() {
        // Nova Análise
        document.getElementById('newAnalysisBtn').addEventListener('click', () => {
            this.showNewAnalysisModal();
        });

        // Ferramentas de Análise
        document.querySelectorAll('.tool-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const toolType = e.target.closest('.tool-card').dataset.tool;
                this.startAnalysis(toolType);
            });
        });

        // Modal
        document.getElementById('cancelAnalysisBtn').addEventListener('click', () => {
            this.hideNewAnalysisModal();
        });

        document.getElementById('newAnalysisForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewAnalysis();
        });

        // Fechar modal
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                this.hideNewAnalysisModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideNewAnalysisModal();
            }
        });

        // Tipo de área
        document.getElementById('areaType').addEventListener('change', (e) => {
            this.toggleAreaSelection(e.target.value);
        });
    }

    showNewAnalysisModal() {
        document.getElementById('newAnalysisModal').style.display = 'block';
    }

    hideNewAnalysisModal() {
        document.getElementById('newAnalysisModal').style.display = 'none';
        document.getElementById('newAnalysisForm').reset();
    }

    toggleAreaSelection(areaType) {
        const savedLocationSelect = document.getElementById('savedLocation');
        
        if (areaType === 'saved') {
            savedLocationSelect.style.display = 'block';
            savedLocationSelect.required = true;
        } else {
            savedLocationSelect.style.display = 'none';
            savedLocationSelect.required = false;
        }
    }

    createNewAnalysis() {
        const form = document.getElementById('newAnalysisForm');
        const formData = new FormData(form);

        const newAnalysis = {
            id: Date.now(),
            type: document.getElementById('analysisType').value,
            name: document.getElementById('analysisName').value,
            description: document.getElementById('analysisDescription').value,
            location: document.getElementById('savedLocation').value,
            priority: document.getElementById('analysisPriority').value,
            tags: document.getElementById('analysisTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            status: 'processing',
            progress: 0,
            date: new Date().toISOString().split('T')[0],
            duration: '0 min'
        };

        this.analyses.unshift(newAnalysis);
        this.saveAnalyses();
        this.renderRecentAnalyses();
        this.hideNewAnalysisModal();

        // Simula processamento
        this.simulateAnalysisProcessing(newAnalysis.id);

        this.showNotification('Análise iniciada com sucesso!', 'success');
    }

    simulateAnalysisProcessing(analysisId) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Atualiza análise para concluída
                const analysisIndex = this.analyses.findIndex(a => a.id === analysisId);
                if (analysisIndex !== -1) {
                    this.analyses[analysisIndex].status = 'completed';
                    this.analyses[analysisIndex].progress = 100;
                    this.analyses[analysisIndex].duration = this.generateRandomDuration();
                    this.analyses[analysisIndex].results = this.generateRandomResults(this.analyses[analysisIndex].type);
                    
                    this.saveAnalyses();
                    this.renderRecentAnalyses();
                    this.showNotification('Análise concluída!', 'success');
                }
            } else {
                // Atualiza progresso
                const analysisIndex = this.analyses.findIndex(a => a.id === analysisId);
                if (analysisIndex !== -1) {
                    this.analyses[analysisIndex].progress = Math.min(progress, 99);
                    this.renderRecentAnalyses();
                }
            }
        }, 1000);
    }

    generateRandomDuration() {
        const durations = ['45 min', '1h 20min', '2h 15min', '1h 45min', '50 min', '1h 30min'];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    generateRandomResults(type) {
        const results = {
            heat: {
                criticalAreas: Math.floor(Math.random() * 5) + 1,
                avgTemperature: 25 + Math.random() * 10,
                recommendations: Math.floor(Math.random() * 8) + 2
            },
            vegetation: {
                ndvi: (0.3 + Math.random() * 0.5).toFixed(2),
                greenCover: (Math.floor(Math.random() * 40) + 10) + '%',
                expansionAreas: Math.floor(Math.random() * 10) + 1
            },
            sustainability: {
                sustainabilityIndex: (5 + Math.random() * 5).toFixed(1),
                energyEfficiency: ['Baixa', 'Média', 'Boa', 'Excelente'][Math.floor(Math.random() * 4)],
                improvements: Math.floor(Math.random() * 15) + 5
            },
            mobility: {
                accessibility: (Math.floor(Math.random() * 80) + 20) + '%',
                traffic: Math.floor(Math.random() * 100),
                recommendations: Math.floor(Math.random() * 6) + 2
            }
        };

        return results[type] || {};
    }

    startAnalysis(toolType) {
        // Preenche o modal automaticamente baseado na ferramenta selecionada
        document.getElementById('analysisType').value = toolType;
        document.getElementById('analysisName').value = this.generateAnalysisName(toolType);
        this.showNewAnalysisModal();
    }

    generateAnalysisName(toolType) {
        const names = {
            heat: 'Análise de Ilhas de Calor',
            vegetation: 'Análise de Cobertura Vegetal',
            sustainability: 'Análise de Sustentabilidade',
            demography: 'Análise Demográfica',
            mobility: 'Análise de Mobilidade',
            hydrology: 'Análise Hidrológica'
        };

        const locations = ['Centro', 'Zona Norte', 'Zona Sul', 'Área Central', 'Região Metropolitana'];
        const cities = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR'];
        
        const location = locations[Math.floor(Math.random() * locations.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        return `${names[toolType]} - ${location} - ${city}`;
    }

    renderRecentAnalyses() {
        const analysisList = document.getElementById('analysisList');
        if (!analysisList) return;

        // Atualiza a lista de análises recentes (últimas 4)
        const recentAnalyses = this.analyses.slice(0, 4);
        
        // Aqui você pode atualizar a lista se necessário
        // Por enquanto, os dados estão estáticos no HTML
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Notificação [${type}]:`, message);
        
        // Remove notificação anterior se existir
        const existingNotification = document.querySelector('.login-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `login-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Métodos para ações das análises
    viewAnalysis(analysisId) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (analysis) {
            // Redireciona para página de resultados ou mostra modal
            console.log('Visualizar análise:', analysis);
            this.showNotification(`Abrindo análise: ${analysis.name}`, 'info');
        }
    }

    exportAnalysis(analysisId) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (analysis) {
            // Simula exportação
            this.showNotification(`Exportando análise: ${analysis.name}`, 'success');
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.analysisManager = new AnalysisManager();
});