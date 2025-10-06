// Model para projetos (em memória)
let projects = [];
let projectIdCounter = 1;

const Project = {
  // Criar projeto
  create: (projectData) => {
    const newProject = {
      id: projectIdCounter++,
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'rascunho',
      createdBy: projectData.createdBy
    };
    projects.push(newProject);
    return newProject;
  },

  // Buscar todos os projetos
  findAll: (userId = null) => {
    if (userId) {
      return projects.filter(project => project.createdBy === userId);
    }
    return projects;
  },

  // Buscar projeto por ID
  findById: (id) => {
    return projects.find(project => project.id === parseInt(id));
  },

  // Atualizar projeto
  update: (id, updateData) => {
    const projectIndex = projects.findIndex(project => project.id === parseInt(id));
    if (projectIndex === -1) return null;

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return projects[projectIndex];
  },

  // Deletar projeto
  delete: (id) => {
    const projectIndex = projects.findIndex(project => project.id === parseInt(id));
    if (projectIndex === -1) return false;

    projects.splice(projectIndex, 1);
    return true;
  },

  // Buscar por categoria
  findByCategory: (category) => {
    return projects.filter(project => project.category === category);
  },

  // Buscar por status
  findByStatus: (status) => {
    return projects.filter(project => project.status === status);
  }
};

module.exports = Project;