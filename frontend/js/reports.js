// Gerenciador da Tela de Relatórios
class ReportsManager {
    constructor() {
        this.reports = [];
        this.selectedReports = new Set();
        this.currentView = 'grid';
        this.init();
    }

    init() {
        this.loadReports();
        this.initializeEventListeners();
        this.renderReports();
        this.updateMetrics();
    }

    loadReports() {
        const savedReports = localStorage.getItem('EcoPlan-reports');
        
        if (savedReports) {
            this.reports = JSON.parse(savedReports);
        } else {
            // Dados de exemplo
            this.reports = [
                {
                    id: 1,
                    type: 'executive',
                    title: 'Análise de Sustentabilidade - Centro SP',
                    description: 'Relatório executivo sobre indicadores de sustentabilidade e propostas de melhorias.',
                    project: 'Parque Linear',
                    status: 'completed',
                    date: '2024-01-15',
                    pages: 24,
                    charts: 12,
                    recommendations: 5,
                    format: 'pdf',
                    fileSize: '2.4 MB'
                },
                {
                    id: 2,
                    type: 'technical',
                    title: 'Análise Técnica - Ilhas de Calor',
                    description: 'Documentação técnica completa sobre mapeamento térmico e soluções.',
                    project: 'Análise: Calor Urbano',
                    status: 'completed',
                    date: '2024-01-12',
                    pages: 42,
                    maps: 8,
                    tables: 15,
                    format: 'pdf',
                    fileSize: '3.8 MB'
                },
                {
                    id: 3,
                    type: 'project',
                    title: 'Relatório Mensal - Corredor Verde',
                    description: 'Acompanhamento do progresso e métricas do projeto de corredor verde.',
                    project: 'Corredor Verde',
                    status: 'completed',
                    date: '2024-01-10',
                    pages: 18,
                    progress: '65%',
                    deliverables: 7,
                    format: 'docx',
                    fileSize: '1.2 MB'
                },
                {
                    id: 4,
                    type: 'sustainability',
                    title: 'Avaliação de Impacto Ambiental',
                    description: 'Análise completa dos impactos ambientais do projeto de mobilidade.',
                    project: 'Projeto: Ciclovias',
                    status: 'generating',
                    progress: 75,
                    date: '2024-01-08',
                    format: 'pdf'
                },
                {
                    id: 5,
                    type: 'executive',
                    title: 'Relatório Trimestral - Projetos',
                    description: 'Visão geral do portfólio de projetos e desempenho trimestral.',
                    project: 'Vários Projetos',
                    status: 'draft',
                    date: '2024-01-05',
                    pages: 12,
                    charts: 6,
                    projects: 3,
                    format: 'pdf'
                }
            ];
            this.saveReports();
        }
    }

    saveReports() {
        localStorage.setItem('EcoPlan-reports', JSON.stringify(this.reports));
    }

    initializeEventListeners() {
        // Gerar Relatório
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.showGenerateReportModal();
        });

        // Usar Template
        document.querySelectorAll('.use-template-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateType = e.target.dataset.template;
                this.useTemplate(templateType);
            });
        });

        // Visualizar Template
        document.querySelectorAll('.preview-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateCard = e.target.closest('.template-card');
                const templateType = templateCard.dataset.template;
                this.previewTemplate(templateType);
            });
        });

        // Modal
        document.getElementById('cancelReportBtn').addEventListener('click', () => {
            this.hideGenerateReportModal();
        });

        document.getElementById('generateReportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateNewReport();
        });

        // Fechar modal
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                this.hideGenerateReportModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideGenerateReportModal();
            }
        });

        // Filtros
        document.getElementById('reportTypeFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('dateRangeFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('reportsSearch').addEventListener('input', () => {
            this.applyFilters();
        });

        // Alternar Visualização
        document.querySelectorAll('.view-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                const viewType = e.target.dataset.view;
                this.switchView(viewType);
            });
        });

        // Ações dos Relatórios
        this.initializeReportActions();
    }

    showGenerateReportModal() {
        document.getElementById('generateReportModal').style.display = 'block';
    }

    hideGenerateReportModal() {
        document.getElementById('generateReportModal').style.display = 'none';
        document.getElementById('generateReportForm').reset();
    }

    useTemplate(templateType) {
        // Preenche o modal com o template selecionado
        document.getElementById('reportTemplate').value = templateType;
        document.getElementById('reportName').value = this.generateReportName(templateType);
        this.showGenerateReportModal();
    }

    previewTemplate(templateType) {
        const templateNames = {
            'executive': 'Relatório Executivo',
            'technical': 'Relatório Técnico',
            'sustainability': 'Relatório de Sustentabilidade',
            'project': 'Relatório de Projeto'
        };

        this.showNotification(`Visualizando prévia do modelo: ${templateNames[templateType]}`, 'info');
    }

    generateReportName(templateType) {
        const names = {
            'executive': 'Relatório Executivo',
            'technical': 'Relatório Técnico',
            'sustainability': 'Relatório de Sustentabilidade',
            'project': 'Relatório de Projeto'
        };

        const projects = ['Parque Linear', 'Corredor Verde', 'Ciclovias', 'Telhados Verdes'];
        const project = projects[Math.floor(Math.random() * projects.length)];
        
        return `${names[templateType]} - ${project}`;
    }

    generateNewReport() {
        const form = document.getElementById('generateReportForm');
        const formData = new FormData(form);

        const newReport = {
            id: Date.now(),
            type: document.getElementById('reportTemplate').value,
            title: document.getElementById('reportName').value,
            description: document.getElementById('reportDescription').value,
            project: document.getElementById('reportProject').value || 'Vários Projetos',
            status: 'generating',
            progress: 0,
            date: new Date().toISOString().split('T')[0],
            format: document.getElementById('reportFormat').value,
            language: document.getElementById('reportLanguage').value
        };

        this.reports.unshift(newReport);
        this.saveReports();
        this.renderReports();
        this.hideGenerateReportModal();

        // Simula geração do relatório
        this.simulateReportGeneration(newReport.id);

        this.showNotification('Relatório em processamento!', 'info');
    }

    simulateReportGeneration(reportId) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Atualiza relatório para concluído
                const reportIndex = this.reports.findIndex(r => r.id === reportId);
                if (reportIndex !== -1) {
                    this.reports[reportIndex].status = 'completed';
                    this.reports[reportIndex].progress = 100;
                    this.reports[reportIndex].pages = Math.floor(Math.random() * 30) + 10;
                    this.reports[reportIndex].charts = Math.floor(Math.random() * 15) + 5;
                    this.reports[reportIndex].fileSize = (Math.random() * 3 + 1).toFixed(1) + ' MB';
                    
                    this.saveReports();
                    this.renderReports();
                    this.updateMetrics();
                    this.showNotification('Relatório gerado com sucesso!', 'success');
                }
            } else {
                // Atualiza progresso
                const reportIndex = this.reports.findIndex(r => r.id === reportId);
                if (reportIndex !== -1) {
                    this.reports[reportIndex].progress = Math.min(progress, 99);
                    this.renderReports();
                }
            }
        }, 800);
    }

    applyFilters() {
        const typeFilter = document.getElementById('reportTypeFilter').value;
        const dateFilter = document.getElementById('dateRangeFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('reportsSearch').value.toLowerCase();

        const filteredReports = this.reports.filter(report => {
            // Filtro de tipo
            if (typeFilter !== 'all' && report.type !== typeFilter) {
                return false;
            }

            // Filtro de status
            if (statusFilter !== 'all' && report.status !== statusFilter) {
                return false;
            }

            // Filtro de busca
            if (searchTerm) {
                const searchableText = `
                    ${report.title} 
                    ${report.description} 
                    ${report.project}
                `.toLowerCase();

                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Filtro de data (simplificado)
            if (dateFilter !== 'all') {
                const reportDate = new Date(report.date);
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        const today = new Date(now.toDateString());
                        if (reportDate < today) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (reportDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (reportDate < monthAgo) return false;
                        break;
                }
            }

            return true;
        });

        this.renderReports(filteredReports);
    }

    switchView(viewType) {
        this.currentView = viewType;
        
        // Atualiza botões ativos
        document.querySelectorAll('.view-toggle').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewType);
        });

        // Atualiza a visualização (para implementação futura)
        const grid = document.getElementById('reportsGrid');
        if (viewType === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
    }

    initializeReportActions() {
        // Delegation para ações dinâmicas
        document.addEventListener('click', (e) => {
            const reportCard = e.target.closest('.report-card');
            if (!reportCard) return;

            const reportId = parseInt(reportCard.dataset.id);
            const action = e.target.closest('[title]');

            if (action) {
                const actionType = action.getAttribute('title');
                this.handleReportAction(reportId, actionType);
            }
        });
    }

    handleReportAction(reportId, actionType) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        switch (actionType) {
            case 'Visualizar':
                this.viewReport(reportId);
                break;
            case 'Download':
                this.downloadReport(reportId);
                break;
            case 'Exportar':
                this.exportReport(reportId);
                break;
            case 'Compartilhar':
                this.shareReport(reportId);
                break;
            case 'Editar':
                this.editReport(reportId);
                break;
            case 'Finalizar':
                this.finalizeReport(reportId);
                break;
            case 'Cancelar':
                this.cancelReport(reportId);
                break;
        }
    }

    viewReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            this.showNotification(`Abrindo relatório: ${report.title}`, 'info');
        }
    }

    downloadReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report && report.status === 'completed') {
            this.showNotification(`Download do relatório: ${report.title}`, 'success');
        } else {
            this.showNotification('Relatório ainda não está disponível para download', 'warning');
        }
    }

    exportReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            this.showNotification(`Exportando relatório: ${report.title}`, 'info');
        }
    }

    shareReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            this.showNotification(`Compartilhando relatório: ${report.title}`, 'info');
        }
    }

    editReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report && report.status === 'draft') {
            this.showNotification(`Editando rascunho: ${report.title}`, 'info');
        }
    }

    finalizeReport(reportId) {
        const reportIndex = this.reports.findIndex(r => r.id === reportId);
        if (reportIndex !== -1 && this.reports[reportIndex].status === 'draft') {
            this.reports[reportIndex].status = 'completed';
            this.saveReports();
            this.renderReports();
            this.showNotification('Rascunho finalizado!', 'success');
        }
    }

    cancelReport(reportId) {
        const reportIndex = this.reports.findIndex(r => r.id === reportId);
        if (reportIndex !== -1 && this.reports[reportIndex].status === 'generating') {
            this.reports.splice(reportIndex, 1);
            this.saveReports();
            this.renderReports();
            this.showNotification('Geração cancelada!', 'info');
        }
    }

    renderReports(reportsToRender = null) {
        const reportsGrid = document.getElementById('reportsGrid');
        if (!reportsGrid) return;

        const reports = reportsToRender || this.reports;
        
        reportsGrid.innerHTML = '';

        reports.forEach(report => {
            const reportCard = this.createReportCard(report);
            reportsGrid.appendChild(reportCard);
        });

        this.updateMetrics();
    }

    createReportCard(report) {
        const card = document.createElement('div');
        card.className = 'report-card';
        card.dataset.id = report.id;
        card.dataset.type = report.type;
        card.dataset.status = report.status;

        const typeIcons = {
            'executive': '👔',
            'technical': '🔧',
            'sustainability': '♻️',
            'project': '📋'
        };

        const statusTexts = {
            'completed': 'Concluído',
            'generating': 'Gerando...',
            'draft': 'Rascunho'
        };

        card.innerHTML = `
            <div class="report-header">
                <div class="report-type ${report.type}">
                    <div class="type-icon">${typeIcons[report.type]}</div>
                    <span>${this.capitalizeFirstLetter(report.type)}</span>
                </div>
                <div class="report-actions">
                    <button class="btn-icon" title="Compartilhar">📤</button>
                    <button class="btn-icon" title="Mais opções">⋯</button>
                </div>
            </div>
            <div class="report-content">
                <h4 class="report-title">${report.title}</h4>
                <p class="report-description">${report.description}</p>
                <div class="report-meta">
                    <span class="report-project">Projeto: ${report.project}</span>
                    <span class="report-date">${report.status === 'generating' ? 'Iniciado' : report.status === 'draft' ? 'Rascunho' : 'Gerado'}: ${this.formatDate(report.date)}</span>
                </div>
                <div class="report-stats">
                    ${this.generateStatsHTML(report)}
                </div>
            </div>
            <div class="report-footer">
                <div class="report-status ${report.status}">
                    ${report.status === 'generating' ? 
                        `<div class="progress-spinner"></div>Gerando... ${report.progress}%` : 
                        `<span class="status-dot"></span>${statusTexts[report.status]}`
                    }
                </div>
                <div class="report-actions-main">
                    ${this.generateActionsHTML(report)}
                </div>
            </div>
        `;

        return card;
    }

    generateStatsHTML(report) {
        if (report.status === 'generating') {
            return `
                <div class="stat">
                    <span class="stat-value">-</span>
                    <span class="stat-label">Páginas</span>
                </div>
                <div class="stat">
                    <span class="stat-value">-</span>
                    <span class="stat-label">Gráficos</span>
                </div>
                <div class="stat">
                    <span class="stat-value">-</span>
                    <span class="stat-label">Seções</span>
                </div>
            `;
        }

        return `
            <div class="stat">
                <span class="stat-value">${report.pages || 0}</span>
                <span class="stat-label">Páginas</span>
            </div>
            <div class="stat">
                <span class="stat-value">${report.charts || report.maps || report.progress || 0}</span>
                <span class="stat-label">${report.charts ? 'Gráficos' : report.maps ? 'Mapas' : 'Progresso'}</span>
            </div>
            <div class="stat">
                <span class="stat-value">${report.recommendations || report.tables || report.deliverables || report.projects || 0}</span>
                <span class="stat-label">${report.recommendations ? 'Recomendações' : report.tables ? 'Tabelas' : report.deliverables ? 'Entregas' : 'Projetos'}</span>
            </div>
        `;
    }

    generateActionsHTML(report) {
        if (report.status === 'generating') {
            return `<button class="btn-icon" title="Cancelar">⏹️</button>`;
        } else if (report.status === 'draft') {
            return `
                <button class="btn-icon" title="Editar">✏️</button>
                <button class="btn-icon" title="Finalizar">✅</button>
            `;
        } else {
            return `
                <button class="btn-icon" title="Visualizar">👁️</button>
                <button class="btn-icon" title="Download">📥</button>
                <button class="btn-icon" title="Exportar">🔄</button>
            `;
        }
    }

    updateMetrics() {
        const totalReports = this.reports.length;
        const thisMonth = this.reports.filter(r => {
            const reportDate = new Date(r.date);
            const now = new Date();
            return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
        }).length;

        const exports = this.reports.filter(r => r.status === 'completed').length * 3; // Simulação

        // Atualiza métricas na interface
        const metricCards = document.querySelectorAll('.metric-card h3');
        if (metricCards.length >= 3) {
            metricCards[0].textContent = totalReports;
            metricCards[1].textContent = thisMonth;
            metricCards[2].textContent = exports;
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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

}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new ReportsManager();
});