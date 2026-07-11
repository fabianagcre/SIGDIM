const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');

// CRUD de Usuarios
router.post('/', UsuarioController.create);
router.get('/', UsuarioController.findAll);
router.get('/:id', UsuarioController.findById);
router.put('/:id', UsuarioController.update);
router.delete('/:id', UsuarioController.delete);

module.exports = router;
