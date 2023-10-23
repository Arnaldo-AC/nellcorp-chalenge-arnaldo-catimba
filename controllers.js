// controllers.js

const db = require('./db');

const depositToAccount = (req, res) => {
    const { account_id, amount } = req.body;
  
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
      res.status(200).json({ message: 'Depósito efetuado com sucesso' });
    });
  };

const withdrawFromAccount = (req, res) => {
    const { account_id, amount } = req.body;
  
    // Verifique se os parâmetros são válidos
    if (!account_id || amount <= 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
  
    // Verifique se a conta existe
    db.query('SELECT balance FROM accounts WHERE account_id = $1', [account_id], (error, result) => {
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
      db.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, account_id], (error) => {
        if (error) {
          console.error('Erro ao fazer o levantamento:', error);
          return res.status(500).json({ error: 'Erro ao fazer o levantamento' });
        }
  
        res.status(200).json({ message: 'Levantamento efetuado com sucesso' });
      });
    });
  };

  const transferBetweenAccounts = (req, res) => {
    const { from_account, to_account, amount } = req.body;
  
    // Verifique se os parâmetros são válidos
    if (!from_account || !to_account || amount <= 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
  
    // Inicie uma transação para garantir que as operações sejam atômicas
    db.query('BEGIN', (error) => {
      if (error) {
        console.error('Erro ao iniciar a transação:', error);
        return res.status(500).json({ error: 'Erro ao iniciar a transação' });
      }
  
      // Verifique se as contas de origem e destino existem
      db.query('SELECT balance FROM accounts WHERE account_id = $1', [from_account], (error, result) => {
        if (error) {
          db.query('ROLLBACK', (rollbackError) => {
            if (rollbackError) {
              console.error('Erro ao reverter a transação:', rollbackError);
            }
            console.error('Erro ao verificar conta de origem:', error);
            return res.status(500).json({ error: 'Erro ao verificar conta de origem' });
          }
        } else if (result.rows.length === 0) {
          db.query('ROLLBACK', (rollbackError) => {
            if (rollbackError) {
              console.error('Erro ao reverter a transação:', rollbackError);
            }
            return res.status(404).json({ error: 'Conta de origem não encontrada' });
          });
        } else {
          const from_balance = result.rows[0].balance;
  
          // Verifique se a conta de origem tem saldo suficiente
          if (from_balance < amount) {
            db.query('ROLLBACK', (rollbackError) => {
              if (rollbackError) {
                console.error('Erro ao reverter a transação:', rollbackError);
              }
              return res.status(400).json({ error: 'Saldo insuficiente na conta de origem' });
            });
          } else {
            // Atualize o saldo da conta de origem
            db.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, from_account], (error) => {
              if (error) {
                db.query('ROLLBACK', (rollbackError) => {
                  if (rollbackError) {
                    console.error('Erro ao reverter a transação:', rollbackError);
                  }
                  console.error('Erro ao atualizar saldo da conta de origem:', error);
                  return res.status(500).json({ error: 'Erro ao atualizar saldo da conta de origem' });
                });
              } else {
                // Verifique se a conta de destino existe
                db.query('SELECT balance FROM accounts WHERE account_id = $1', [to_account], (error, result) => {
                  if (error) {
                    db.query('ROLLBACK', (rollbackError) => {
                      if (rollbackError) {
                        console.error('Erro ao reverter a transação:', rollbackError);
                      }
                      console.error('Erro ao verificar conta de destino:', error);
                      return res.status(500).json({ error: 'Erro ao verificar conta de destino' });
                    });
                  } else if (result.rows.length === 0) {
                    db.query('ROLLBACK', (rollbackError) => {
                      if (rollbackError) {
                        console.error('Erro ao reverter a transação:', rollbackError);
                      }
                      return res.status(404).json({ error: 'Conta de destino não encontrada' });
                    });
                  } else {
                    const to_balance = result.rows[0].balance;
  
                    // Atualize o saldo da conta de destino
                    db.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, to_account], (error) => {
                      if (error) {
                        db.query('ROLLBACK', (rollbackError) => {
                          if (rollbackError) {
                            console.error('Erro ao reverter a transação:', rollbackError);
                          }
                          console.error('Erro ao atualizar saldo da conta de destino:', error);
                          return res.status(500).json({ error: 'Erro ao atualizar saldo da conta de destino' });
                        });
                      } else {
                        // Commit a transação após a conclusão bem-sucedida
                        db.query('COMMIT', (error) => {
                          if (error) {
                            console.error('Erro ao confirmar a transação:', error);
                            return res.status(500).json({ error: 'Erro ao confirmar a transação' });
                          }
                          res.status(200).json({ message: 'Transferência efetuada com sucesso' });
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        }
      });
    });
  };

module.exports = {
  depositToAccount,
  withdrawFromAccount,
  transferBetweenAccounts,
};
