CREATE DATABASE db_nellcorp;

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    account_type VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00
);

INSERT INTO accounts (account_type, balance) VALUES ('restaurante', 0.00);
INSERT INTO accounts (account_type, balance) VALUES ('empregado_mesa', 0.00);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id_from INT REFERENCES accounts(account_id),
    account_id_to INT REFERENCES accounts(account_id),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (account_id_to, amount, transaction_type) VALUES (1, 100.00, 'deposito');
INSERT INTO transactions (account_id_from, amount, transaction_type) VALUES (1, -50.00, 'levantamento');




