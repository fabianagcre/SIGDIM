const express = require('express');
const router = express.Router();
const RepresentacionController = require('../controllers/RepresentacionController');

// CRUD de Representaciones
router.post('/', RepresentacionController.create);
router.get('/', RepresentacionController.findAll);
router.get('/:id', RepresentacionController.findById);
router.put('/:id/revoke', RepresentacionController.revoke);

module.exports = router;
