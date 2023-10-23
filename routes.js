// routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/api/dados', controller.getAllData);
router.post('/api/deposito', controller.depositToAccount);
router.post('/api/levantamento', controller.withdrawFromAccount);
router.post('/api/transferencia', controller.transferBetweenAccounts);
router.post('/api/reembolso', controller.refundTransaction);

module.exports = router;
