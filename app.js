const express = require('express');
const app = express();
const port = 3000; // Escolha uma porta disponível
const routes = require('./routes');

app.use(express.json());
app.use(routes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

