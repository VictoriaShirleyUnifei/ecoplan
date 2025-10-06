// Gerenciador da Tela de Projects
class ProjectsManager {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentFilters = {
            status: 'all',
            type: 'all',
            date: 'all',
            search: ''
        };
        this.init();
    }

    init() {
        this.loadProjects();
        this.initializeEventListeners();
        this.renderProjects();
    }

    loadProjects() {
        // Carrega projetos do localStorage ou usa dados padrão
        const savedProjects = localStorage.getItem('EcoPlan-projects');
        
        if (savedProjects) {
            this.projects = JSON.parse(savedProjects);
        } else {
            // Dados de exemplo
            this.projects = [
                {
                    id: 1,
                    title: 'Parque Linear Centro',
                    description: 'Projeto de revitalização urbana com corredor verde conectando áreas centrais da cidade.',
                    location: 'São Paulo, SP',
                    type: 'urban',
                    status: 'active',
                    progress: 65,
                    startDate: '2024-01-15',
                    collaborators: ['JS', 'MA', 'PL', 'RC'],
                    tags: ['revitalização', 'áreas-verdes', 'centro']
                },
                {
                    id: 2,
                    title: 'Corredor Verde Norte',
                    description: 'Conectividade de áreas verdes na zona norte com foco em biodiversidade e recreação.',
                    location: 'Rio de Janeiro, RJ',
                    type: 'green',
                    status: 'planned',
                    progress: 20,
                    startDate: '2024-03-01',
                    collaborators: ['AC'],
                    tags: ['biodiversidade', 'conectividade', 'recreação']
                },
                {
                    id: 3,
                    title: 'Ciclovia Central',
                    description: 'Rede de ciclovias integradas ao transporte público no centro expandido.',
                    location: 'Belo Horizonte, MG',
                    type: 'mobility',
                    status: 'completed',
                    progress: 100,
                    startDate: '2023-10-01',
                    endDate: '2023-12-10',
                    collaborators: ['RM', 'LP', 'TC'],
                    tags: ['mobilidade', 'ciclovias', 'transporte']
                }
            ];
            this.saveProjects();
        }
    }

    saveProjects() {
        localStorage.setItem('EcoPlan-projects', JSON.stringify(this.projects));
    }

    initializeEventListeners() {
        // Filtros
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.applyFilters();
        });

        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.applyFilters();
        });

        // Busca
        document.getElementById('projectsSearch').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Novo Projeto
        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.showNewProjectModal();
        });

        document.getElementById('addProjectCard').addEventListener('click', () => {
            this.showNewProjectModal();
        });

        // Modal
        document.getElementById('cancelProjectBtn').addEventListener('click', () => {
            this.hideNewProjectModal();
        });

        document.getElementById('newProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewProject();
        });

        // Fechar modal
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                this.hideNewProjectModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideNewProjectModal();
            }
        });
    }

    applyFilters() {
        this.filteredProjects = this.projects.filter(project => {
            // Filtro de status
            if (this.currentFilters.status !== 'all' && project.status !== this.currentFilters.status) {
                return false;
            }

            // Filtro de tipo
            if (this.currentFilters.type !== 'all' && project.type !== this.currentFilters.type) {
                return false;
            }

            // Filtro de busca
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `
                    ${project.title} 
                    ${project.description} 
                    ${project.location} 
                    ${project.tags.join(' ')}
                `.toLowerCase();

                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Filtro de data (simplificado)
            if (this.currentFilters.date !== 'all') {
                // Implementação básica - pode ser expandida
                const projectDate = new Date(project.startDate);
                const now = new Date();
                
                switch (this.currentFilters.date) {
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (projectDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (projectDate < monthAgo) return false;
                        break;
                    // Outros casos podem ser implementados
                }
            }

            return true;
        });

        this.renderProjects();
    }

    renderProjects() {
        const grid = document.getElementById('projectsGrid');
        const projectsToRender = this.filteredProjects.length > 0 ? this.filteredProjects : this.projects;

        // Remove todos os cards exceto o de novo projeto
        const existingCards = grid.querySelectorAll('.project-card:not(.new-project-card)');
        existingCards.forEach(card => card.remove());

        // Adiciona os projetos filtrados
        projectsToRender.forEach(project => {
            const projectCard = this.createProjectCard(project);
            grid.insertBefore(projectCard, document.getElementById('addProjectCard'));
        });

        // Atualiza contador
        this.updateProjectCount();
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = `project-card`;
        card.dataset.status = project.status;
        card.dataset.type = project.type;

        const statusText = {
            'active': 'Em Andamento',
            'planned': 'Planejado',
            'completed': 'Concluído',
            'paused': 'Pausado'
        };

        const typeText = {
            'urban': 'Plano Urbanístico',
            'green': 'Áreas Verdes',
            'mobility': 'Mobilidade',
            'sustainability': 'Sustentabilidade'
        };

        card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.title}</h3>
                <div class="project-actions">
                    <button class="btn-icon" title="Editar" onclick="projectsManager.editProject(${project.id})">✏️</button>
                    <button class="btn-icon" title="Compartilhar" onclick="projectsManager.shareProject(${project.id})">📤</button>
                    <button class="btn-icon" title="Mais opções" onclick="projectsManager.showProjectOptions(${project.id})">⋯</button>
                </div>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-meta">
                <span class="project-location">📍 ${project.location}</span>
                <span class="project-date">📅 ${project.status === 'completed' ? 'Concluído' : 'Iniciado'}: ${this.formatDate(project.startDate)}</span>
            </div>
            <div class="project-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                </div>
                <span class="progress-text">${project.progress}% concluído</span>
            </div>
            <div class="project-footer">
                <div class="project-status ${project.status}">
                    <span class="status-dot"></span>
                    ${statusText[project.status]}
                </div>
                <div class="project-collaborators">
                    <div class="avatar-group">
                        ${project.collaborators.map((collab, index) => 
                            `<div class="avatar" title="${collab}">${collab}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    updateProjectCount() {
        const activeCount = this.projects.filter(p => p.status === 'active').length;
        const completedCount = this.projects.filter(p => p.status === 'completed').length;
        const plannedCount = this.projects.filter(p => p.status === 'planned').length;

        // Atualiza as estatísticas
        document.querySelectorAll('.stat-card h3').forEach((element, index) => {
            switch (index) {
                case 0: element.textContent = activeCount; break;
                case 1: element.textContent = completedCount; break;
                case 2: element.textContent = plannedCount; break;
            }
        });
    }

    showNewProjectModal() {
        document.getElementById('newProjectModal').style.display = 'block';
    }

    hideNewProjectModal() {
        document.getElementById('newProjectModal').style.display = 'none';
        document.getElementById('newProjectForm').reset();
    }

    createNewProject() {
        const form = document.getElementById('newProjectForm');
        const formData = new FormData(form);

        const newProject = {
            id: Date.now(),
            title: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            location: document.getElementById('projectLocation').value,
            type: document.getElementById('projectType').value,
            status: 'planned',
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            collaborators: [],
            tags: document.getElementById('projectTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        this.projects.unshift(newProject);
        this.saveProjects();
        this.applyFilters();
        this.hideNewProjectModal();

        // Feedback visual
        this.showNotification('Projeto criado com sucesso!', 'success');
    }

    editProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            // Preenche o modal com dados do projeto
            document.getElementById('projectName').value = project.title;
            document.getElementById('projectDescription').value = project.description;
            document.getElementById('projectLocation').value = project.location;
            document.getElementById('projectType').value = project.type;
            document.getElementById('projectTags').value = project.tags.join(', ');
            
            // Altera o modal para modo edição
            document.querySelector('#newProjectModal h2').textContent = 'Editar Projeto';
            document.querySelector('#newProjectForm button[type="submit"]').textContent = 'Salvar Alterações';
            
            // Remove o listener antigo e adiciona novo para edição
            const form = document.getElementById('newProjectForm');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.updateProject(projectId);
            };
            
            this.showNewProjectModal();
        }
    }

    updateProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            this.projects[projectIndex] = {
                ...this.projects[projectIndex],
                title: document.getElementById('projectName').value,
                description: document.getElementById('projectDescription').value,
                location: document.getElementById('projectLocation').value,
                type: document.getElementById('projectType').value,
                tags: document.getElementById('projectTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            this.saveProjects();
            this.applyFilters();
            this.hideNewProjectModal();
            this.showNotification('Projeto atualizado com sucesso!', 'success');
        }
    }

    shareProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project && navigator.share) {
            navigator.share({
                title: project.title,
                text: project.description,
                url: `${window.location.origin}/project/${projectId}`
            });
        } else {
            // Fallback para copiar link
            const projectUrl = `${window.location.origin}/project/${projectId}`;
            navigator.clipboard.writeText(projectUrl);
            this.showNotification('Link do projeto copiado!', 'success');
        }
    }

    showProjectOptions(projectId) {
        // Implementar menu de contexto para mais opções    
        console.log('Abrir opções do projeto:', projectId);
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
    window.projectsManager = new ProjectsManager();
});