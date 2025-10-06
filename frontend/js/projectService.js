class ProjectService {
  constructor() {
    this.API_BASE_URL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('authToken');
  }

  // Headers para requisições autenticadas
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Verificar autenticação
  checkAuth() {
    if (!this.token) {
      throw new Error('Usuário não autenticado');
    }
  }

  // Criar projeto
  async createProject(projectData) {
    this.checkAuth();

    try {
      const response = await fetch(`${this.API_BASE_URL}/projects`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(projectData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar projeto');
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
  }

  // Buscar todos os projetos
  async getProjects() {
    this.checkAuth();

    try {
      const response = await fetch(`${this.API_BASE_URL}/projects`, {
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar projetos');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      throw error;
    }
  }

  // Buscar projeto por ID
  async getProjectById(id) {
    this.checkAuth();

    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/${id}`, {
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar projeto');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      throw error;
    }
  }

  // Atualizar projeto
  async updateProject(id, projectData) {
    this.checkAuth();

    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(projectData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar projeto');
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  // Deletar projeto
  async deleteProject(id) {
    this.checkAuth();

    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao deletar projeto');
      }

      return data;
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      throw error;
    }
  }

  // Buscar projetos por categoria
  async getProjectsByCategory(category) {
    this.checkAuth();

    try {
      const response = await fetch(`${this.API_BASE_URL}/projects/category/${category}`, {
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar projetos por categoria');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar projetos por categoria:', error);
      throw error;
    }
  }

  // Estatísticas dos projetos
  async getProjectStats() {
    this.checkAuth();

    try {
      const projects = await this.getProjects();
      
      const stats = {
        total: projects.count,
        byCategory: {},
        byStatus: {},
        recent: projects.projects.slice(0, 5) // Últimos 5 projetos
      };

      // Agrupar por categoria
      projects.projects.forEach(project => {
        stats.byCategory[project.category] = (stats.byCategory[project.category] || 0) + 1;
        stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

// Instância global do serviço
window.projectService = new ProjectService();