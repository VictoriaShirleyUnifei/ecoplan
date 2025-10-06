const express = require('express');
const { register, login, getMe } = require('../controllers/authcontroller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas
router.get('/me', protect, getMe);

module.exports = router;