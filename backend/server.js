const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', require('./routes/auth'));

// Rotas de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: '✅ OK',
    message: 'Backend EcoPlan está funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

// Rota 404 CORRIGIDA - sem wildcard problemático
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ 
    success: false,
    message: 'Erro interno do servidor' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('✅ Backend EcoPlan iniciado com sucesso!');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log('🚀 ========================================');
});