// controller.js
const db = require('./db');

const depositToAccount = (req, res) => {
    const { account_id, amount } = req.body;
  
    try {
      // Verifique se os parâmetros são válidos
      if (!account_id || amount <= 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
  
      // Execute a lógica de depósito, atualizando o saldo da conta
      db.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, account_id], (error, result) => {
        if (error) {
          console.error('Erro ao fazer o depósito:', error);
          return res.status(500).json({ error: 'Erro ao fazer o depósito' });
        }
  
        // Registre a transação na tabela de transações
        const transactionDetails = {
          account_id_from: null, // Preencha com o valor correto, se aplicável
          account_id_to: account_id,
          amount: amount,
          transaction_type: 'depósito',
          timestamp: new Date(),
        };
  
        db.query('INSERT INTO transactions (account_id_from, account_id_to, amount, transaction_type, timestamp) VALUES ($1, $2, $3, $4, $5)', 
          [transactionDetails.account_id_from, transactionDetails.account_id_to, transactionDetails.amount, transactionDetails.transaction_type, transactionDetails.timestamp], (transactionError) => {
          if (transactionError) {
            console.error('Erro ao registrar a transação:', transactionError);
            // Aqui você pode optar por não interromper a resposta, mas registrar um erro de transação
          }
  
          res.status(200).json({ message: 'Depósito efetuado com sucesso' });
        });
      });
    } catch (error) {
      console.error('Erro ao processar a solicitação:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  };
  

  const withdrawFromAccount = (req, res) => {
    const { account_id, amount } = req.body;
  
    try {
      // Verifique se os parâmetros são válidos
      if (!account_id || amount <= 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
  
      // Verifique se a conta existe
      db.query('SELECT balance FROM accounts WHERE account_id = $1', [account_id], (error, result) => {
        try {
          if (error) {
            console.error('Erro ao verificar conta:', error);
            return res.status(500).json({ error: 'Erro ao verificar conta' });
          }
  
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada' });
          }
  
          const balance = result.rows[0].balance;
  
          // Verifique se o saldo da conta é suficiente para o levantamento
          if (balance < amount) {
            return res.status(400).json({ error: 'Saldo insuficiente na conta' });
          }
  
          // Execute a lógica de levantamento, atualizando o saldo da conta
          db.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, account_id], (withdrawError) => {
            if (withdrawError) {
              console.error('Erro ao fazer o levantamento:', withdrawError);
              return res.status(500).json({ error: 'Erro ao fazer o levantamento' });
            }
  
            // Registre a transação de levantamento na tabela de transações
            const transactionDetails = {
              account_id_from: account_id,
              account_id_to: null, // Preencha com o valor correto, se aplicável
              amount: -amount, // Valor negativo para representar o levantamento
              transaction_type: 'levantamento',
              timestamp: new Date(),
            };
  
            db.query('INSERT INTO transactions (account_id_from, account_id_to, amount, transaction_type, timestamp) VALUES ($1, $2, $3, $4, $5)', 
              [transactionDetails.account_id_from, transactionDetails.account_id_to, transactionDetails.amount, transactionDetails.transaction_type, transactionDetails.timestamp], (transactionError) => {
              if (transactionError) {
                console.error('Erro ao registrar a transação de levantamento:', transactionError);
                // Aqui você pode optar por não interromper a resposta, mas registrar um erro de transação
              }
  
              res.status(200).json({ message: 'Levantamento efetuado com sucesso' });
            });
          });
        } catch (innerError) {
          console.error('Erro interno ao verificar conta:', innerError);
          return res.status(500).json({ error: 'Erro interno ao verificar conta' });
        }
      });
    } catch (outerError) {
      console.error('Erro na validação de parâmetros:', outerError);
      return res.status(500).json({ error: 'Erro na validação de parâmetros' });
    }
  };
  
  
  const transferBetweenAccounts = (req, res) => {
    const { sender_account_id, receiver_account_id, amount } = req.body;
  
    try {
      // Verifique se os parâmetros são válidos
      if (!sender_account_id || !receiver_account_id || amount <= 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
  
      // Verifique se as contas existem e obtenha seus saldos
      db.query('SELECT balance FROM accounts WHERE account_id = $1', [sender_account_id], (error, senderResult) => {
        try {
          if (error) {
            console.error('Erro ao verificar conta remetente:', error);
            return res.status(500).json({ error: 'Erro ao verificar conta remetente' });
          }
  
          if (senderResult.rows.length !== 1) {
            return res.status(404).json({ error: 'Conta remetente não encontrada' });
          }
  
          const senderBalance = senderResult.rows[0].balance;
  
          // Verifique se a conta remetente tem saldo suficiente para a transferência
          if (senderBalance < amount) {
            return res.status(400).json({ error: 'Saldo insuficiente na conta remetente' });
          }
  
          // Obtenha o saldo da conta destinatária
          db.query('SELECT balance FROM accounts WHERE account_id = $1', [receiver_account_id], (error, receiverResult) => {
            try {
              if (error) {
                console.error('Erro ao verificar conta destinatária:', error);
                return res.status(500).json({ error: 'Erro ao verificar conta destinatária' });
              }
  
              if (receiverResult.rows.length !== 1) {
                return res.status(404).json({ error: 'Conta destinatária não encontrada' });
              }
  
              const receiverBalance = receiverResult.rows[0].balance;
  
              // Iniciar transação
              db.query('BEGIN', (beginError) => {
                if (beginError) {
                  console.error('Erro ao iniciar transação:', beginError);
                  return res.status(500).json({ error: 'Erro ao iniciar transação' });
                }
  
                // Subtrair o valor da conta remetente
                db.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, sender_account_id], (updateSenderError) => {
                  if (updateSenderError) {
                    console.error('Erro ao subtrair da conta remetente:', updateSenderError);
                    return db.query('ROLLBACK', () => {
                      res.status(500).json({ error: 'Erro ao subtrair da conta remetente' });
                    });
                  }
  
                  // Adicionar o valor à conta destinatária
                  db.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, receiver_account_id], (updateReceiverError) => {
                    if (updateReceiverError) {
                      console.error('Erro ao adicionar à conta destinatária:', updateReceiverError);
                      return db.query('ROLLBACK', () => {
                        res.status(500).json({ error: 'Erro ao adicionar à conta destinatária' });
                      });
                    }
  
                    // Registre a transação de transferência na tabela de transações
                    const transactionDetails = {
                      account_id_from: sender_account_id,
                      account_id_to: receiver_account_id,
                      amount: amount,
                      transaction_type: 'transferencia',
                      timestamp: new Date(),
                    };
  
                    db.query('INSERT INTO transactions (account_id_from, account_id_to, amount, transaction_type, timestamp) VALUES ($1, $2, $3, $4, $5)', 
                      [transactionDetails.account_id_from, transactionDetails.account_id_to, transactionDetails.amount, transactionDetails.transaction_type, transactionDetails.timestamp], (transactionError) => {
                      if (transactionError) {
                        console.error('Erro ao registrar a transação de transferência:', transactionError);
                        return db.query('ROLLBACK', () => {
                          res.status(500).json({ error: 'Erro ao registrar a transação de transferência' });
                        });
                      }
  
                      // Confirmar a transação
                      db.query('COMMIT', (commitError) => {
                        if (commitError) {
                          console.error('Erro ao confirmar a transação:', commitError);
                          return res.status(500).json({ error: 'Erro ao confirmar a transação' });
                        }
  
                        res.status(200).json({ message: 'Transferência efetuada com sucesso' });
                      });
                    });
                  });
                });
              });
            } catch (innerError) {
              console.error('Erro interno ao verificar conta destinatária:', innerError);
              return res.status(500).json({ error: 'Erro interno ao verificar conta destinatária' });
            }
          });
        } catch (innerError) {
          console.error('Erro interno ao verificar conta remetente:', innerError);
          return res.status(500).json({ error: 'Erro interno ao verificar conta remetente' });
        }
      });
    } catch (outerError) {
      console.error('Erro na validação de parâmetros:', outerError);
      return res.status(500).json({ error: 'Erro na validação de parâmetros' });
    }
  };
  
  const refundTransaction = (req, res) => {
    const { transaction_id, amount } = req.body;
  
    try {
      // Verifique se os parâmetros são válidos
      if (!transaction_id || amount <= 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
  
      // Verifique se a transação existe e obtenha as informações necessárias
      db.query('SELECT account_id_from, account_id_to FROM transactions WHERE transaction_id = $1', [transaction_id], (error, result) => {
        try {
          if (error) {
            console.error('Erro ao verificar a transação:', error);
            return res.status(500).json({ error: 'Erro ao verificar a transação' });
          }
  
          if (result.rows.length !== 1) {
            return res.status(404).json({ error: 'Transação não encontrada' });
          }
  
          const sender_account_id = result.rows[0].sender_account_id;
          const receiver_account_id = result.rows[0].receiver_account_id;
  
          // Iniciar transação para realizar o reembolso
          db.query('BEGIN', (beginError) => {
            if (beginError) {
              console.error('Erro ao iniciar transação:', beginError);
              return res.status(500).json({ error: 'Erro ao iniciar transação' });
            }
  
            // Adicionar o valor à conta do remetente
            db.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, sender_account_id], (updateSenderError) => {
              if (updateSenderError) {
                console.error('Erro ao adicionar à conta do remetente:', updateSenderError);
                return db.query('ROLLBACK', () => {
                  res.status(500).json({ error: 'Erro ao adicionar à conta do remetente' });
                });
              }
  
              // Subtrair o valor da conta do destinatário
              db.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, receiver_account_id], (updateReceiverError) => {
                if (updateReceiverError) {
                  console.error('Erro ao subtrair da conta do destinatário:', updateReceiverError);
                  return db.query('ROLLBACK', () => {
                    res.status(500).json({ error: 'Erro ao subtrair da conta do destinatário' });
                  });
                }
  
                // Confirmar a transação de reembolso
                db.query('COMMIT', (commitError) => {
                  if (commitError) {
                    console.error('Erro ao confirmar a transação de reembolso:', commitError);
                    return res.status(500).json({ error: 'Erro ao confirmar a transação de reembolso' });
                  }
  
                  res.status(200).json({ message: 'Reembolso efetuado com sucesso' });
                });
              });
            });
          });
        } catch (innerError) {
          console.error('Erro interno ao verificar a transação:', innerError);
          return res.status(500).json({ error: 'Erro interno ao verificar a transação' });
        }
      });
    } catch (outerError) {
      console.error('Erro na validação de parâmetros:', outerError);
      return res.status(500).json({ error: 'Erro na validação de parâmetros' });
    }
  };
  
  const getAccountBalance = (req, res) => {
    const { account_id } = req.params; // Supondo que você está passando o account_id como um parâmetro de rota
  
    try {
      // Verifique se o parâmetro é válido
      if (!account_id) {
        return res.status(400).json({ error: 'Parâmetro inválido' });
      }
  
      // Consulte o saldo da conta
      db.query('SELECT balance FROM accounts WHERE account_id = $1', [account_id], (error, result) => {
        if (error) {
          console.error('Erro ao obter saldo da conta:', error);
          return res.status(500).json({ error: 'Erro ao obter saldo da conta' });
        }
  
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Conta não encontrada' });
        }
  
        const balance = result.rows[0].balance;
  
        res.status(200).json({ balance: balance });
      });
    } catch (error) {
      console.error('Erro ao processar a solicitação:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  };

  const getAccountTransactions = (req, res) => {
    const { account_id } = req.params; // Supondo que você está passando o account_id como um parâmetro de rota
  
    try {
      // Verifique se o parâmetro é válido
      if (!account_id) {
        return res.status(400).json({ error: 'Parâmetro inválido' });
      }
  
      // Consulte o histórico de transações para a conta
      db.query('SELECT * FROM transactions WHERE account_id_from = $1 OR account_id_to = $1', [account_id], (error, result) => {
        if (error) {
          console.error('Erro ao obter histórico de transações:', error);
          return res.status(500).json({ error: 'Erro ao obter histórico de transações' });
        }
  
        res.status(200).json(result.rows);
      });
    } catch (error) {
      console.error('Erro ao processar a solicitação:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  };
  

module.exports = {
  depositToAccount,
  withdrawFromAccount,
  transferBetweenAccounts,
  refundTransaction,
  getAccountBalance,
  getAccountTransactions
};
