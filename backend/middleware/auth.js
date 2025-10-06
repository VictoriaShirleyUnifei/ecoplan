const jwt = require('jsonwebtoken');
const { findUserById } = require('../utils/helpers');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se usuário ainda existe
    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuário não existe.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido.'
    });
  }
};

module.exports = {
  protect
};