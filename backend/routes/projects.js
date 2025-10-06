const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByCategory
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas são protegidas
router.use(protect);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.get('/category/:category', getProjectsByCategory);

module.exports = router;