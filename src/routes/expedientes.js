const express = require('express');
const router = express.Router();
const ExpedienteController = require('../controllers/ExpedienteController');

// Rutas para expedientes
router.get('/', ExpedienteController.findAll);
router.get('/:id', ExpedienteController.findById);
router.put('/:id', ExpedienteController.update);

module.exports = router;
