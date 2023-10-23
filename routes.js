// routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/api/deposito', controller.depositToAccount);
router.post('/api/levantamento', controller.withdrawFromAccount);
router.post('/api/transferencia', controller.transferBetweenAccounts);
router.post('/api/reembolso', controller.refundTransaction);
router.get('/api/contas/:account_id/saldo', controller.getAccountBalance);
router.get('/api/contas/:account_id/transacoes', controller.getAccountTransactions);

module.exports = router;
