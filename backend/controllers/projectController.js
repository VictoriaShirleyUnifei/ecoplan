const Project = require('../models/Project');

// @desc    Criar novo projeto
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      budget,
      timeline,
      tags
    } = req.body;

    // Validações
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Título, descrição e categoria são obrigatórios'
      });
    }

    const projectData = {
      title,
      description,
      category,
      location: location || {},
      budget: budget || {},
      timeline: timeline || {},
      tags: tags || [],
      createdBy: req.user.id
    };

    const project = Project.create(projectData);

    res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso!',
      project
    });

  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar projeto'
    });
  }
};

// @desc    Buscar todos os projetos do usuário
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = Project.findAll(req.user.id);

    res.json({
      success: true,
      count: projects.length,
      projects
    });

  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar projetos'
    });
  }
};

// @desc    Buscar projeto por ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o projeto pertence ao usuário
    if (project.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este projeto'
      });
    }

    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar projeto'
    });
  }
};

// @desc    Atualizar projeto
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o projeto pertence ao usuário
    if (project.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este projeto'
      });
    }

    const updatedProject = Project.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Projeto atualizado com sucesso!',
      project: updatedProject
    });

  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar projeto'
    });
  }
};

// @desc    Deletar projeto
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o projeto pertence ao usuário
    if (project.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este projeto'
      });
    }

    Project.delete(req.params.id);

    res.json({
      success: true,
      message: 'Projeto deletado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar projeto'
    });
  }
};

// @desc    Buscar projetos por categoria
// @route   GET /api/projects/category/:category
// @access  Private
const getProjectsByCategory = async (req, res) => {
  try {
    const projects = Project.findByCategory(req.params.category)
      .filter(project => project.createdBy === req.user.id);

    res.json({
      success: true,
      count: projects.length,
      category: req.params.category,
      projects
    });

  } catch (error) {
    console.error('Erro ao buscar projetos por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar projetos'
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByCategory
};