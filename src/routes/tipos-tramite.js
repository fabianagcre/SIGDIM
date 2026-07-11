const express = require('express');
const router = express.Router();
const TipoTramiteController = require('../controllers/TipoTramiteController');

// Rutas para tipos de trámite
router.post('/', TipoTramiteController.create);
router.get('/', TipoTramiteController.findAll);
router.get('/:id', TipoTramiteController.findById);

module.exports = router;
