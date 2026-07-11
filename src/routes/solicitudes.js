const express = require('express');
const router = express.Router();
const SolicitudController = require('../controllers/SolicitudController');

// CRUD de Solicitudes
router.post('/', SolicitudController.create);
router.get('/', SolicitudController.findAll);
router.get('/:id', SolicitudController.findById);
router.put('/:id', SolicitudController.update);

module.exports = router;
