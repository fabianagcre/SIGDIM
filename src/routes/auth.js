const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rutas protegidas
router.post('/logout', verifyToken, AuthController.logout);
router.get('/verify', verifyToken, AuthController.verifyTokenEndpoint);

module.exports = router;
